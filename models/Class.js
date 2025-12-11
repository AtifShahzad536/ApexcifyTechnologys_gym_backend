const mongoose = require('mongoose');

const classSchema = mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        trainer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        startTime: {
            type: Date,
            required: true,
        },
        duration: {
            type: Number, // in minutes
            required: true,
        },
        capacity: {
            type: Number,
            required: true,
        },
        enrolledMembers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
    },
    {
        timestamps: true,
    }
);

const Class = mongoose.model('Class', classSchema);

module.exports = Class;
