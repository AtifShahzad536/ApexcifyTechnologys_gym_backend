const asyncHandler = require('express-async-handler');
const Stripe = require('stripe');
const Subscription = require('../models/Subscription');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// @desc    Create checkout session
// @route   POST /api/payments/create-checkout-session
// @access  Private
const createCheckoutSession = asyncHandler(async (req, res) => {
  const { plan } = req.body;

  if (!plan) {
    res.status(400);
    throw new Error('Plan is required');
  }

  // Determine price based on plan
  let amount;
  switch (plan.toLowerCase()) {
    case 'basic':
      amount = 2900; // $29.00 in cents
      break;
    case 'pro':
      amount = 5900; // $59.00
      break;
    case 'elite':
      amount = 9900; // $99.00
      break;
    default:
      amount = 2900;
  }

  // Create Stripe checkout session with dynamic price
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${plan} Membership`,
            description: `Monthly ${plan} gym membership`,
          },
          unit_amount: amount,
          recurring: {
            interval: 'month',
          },
        },
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `http://localhost:5175/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `http://localhost:5175/subscription`,
    customer_email: req.user.email,
    metadata: {
      userId: req.user._id.toString(),
      plan: plan
    }
  });

  res.json({ id: session.id, url: session.url });
});

// @desc    Create subscription (called after successful payment)
// @route   POST /api/payments/subscription
// @access  Private
const createSubscription = asyncHandler(async (req, res) => {
  const { plan, sessionId } = req.body;

  // Calculate end date (e.g., 1 month from now)
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  const subscription = await Subscription.create({
    member: req.user._id,
    plan,
    endDate,
    stripeSessionId: sessionId,
  });

  res.status(201).json(subscription);
});

// @desc    Get my subscription
// @route   GET /api/payments/my-subscription
// @access  Private
const getMySubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({
    member: req.user._id,
    status: 'active',
  }).sort('-createdAt');

  res.json(subscription || { message: 'No active subscription' });
});

// @desc    Cancel subscription
// @route   POST /api/payments/subscription/cancel
// @access  Private
const cancelSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({
    member: req.user._id,
    status: 'active',
  });

  if (subscription) {
    subscription.status = 'cancelled';
    await subscription.save();

    // Ideally we would also cancel in Stripe here using stripe.subscriptions.cancel(subscription.stripeSubscriptionId)

    res.json({ message: 'Subscription cancelled successfully' });
  } else {
    res.status(404);
    throw new Error('No active subscription found');
  }
});

module.exports = {
  createCheckoutSession,
  createSubscription,
  getMySubscription,
  cancelSubscription,
};
