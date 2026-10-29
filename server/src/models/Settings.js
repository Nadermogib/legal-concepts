/**
 * @file Settings.js
 * نموذج Mongoose لإعدادات التطبيق (مستند واحد key: "app")
 * وفق القسم 4.1 من المواصفات.
 */

import mongoose from 'mongoose'

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'app',
    },
    enabledDepartmentIds: {
      type: [String],
      required: true,
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'settings',
    bufferCommands: false,
  }
)

export const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema)
