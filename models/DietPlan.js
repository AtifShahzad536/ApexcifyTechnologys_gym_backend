const mongoose = require('mongoose');

const dietPlanSchema = mongoose.Schema(
    {
        member: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        trainer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        meals: [
            {
                name: { type: String, required: true }, // e.g., Breakfast
                items: [
                    {
                        food: { type: String, required: true },
                        quantity: { type: String, required: true },
                        calories: { type: Number },
                        protein: { type: Number },
                        carbs: { type: Number },
                        fats: { type: Number },
                    },
                ],
                time: { type: String }, // e.g., 8:00 AM
            },
        ],
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const DietPlan = mongoose.model('DietPlan', dietPlanSchema);

module.exports = DietPlan;
