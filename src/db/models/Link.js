const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Link = sequelize.define('Link', {
    url: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isUrl: true,
        },
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    summary: {
        type: DataTypes.TEXT,
    },
    content_text: {
        type: DataTypes.TEXT,
    },
    media_type: {
        type: DataTypes.ENUM('article', 'video', 'tweet', 'other'),
        defaultValue: 'article',
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = Link;
