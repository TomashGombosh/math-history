import { DataTypes } from "sequelize";
import { sequelize } from "../utils/db.js";

export const Graduate = sequelize.define(
  "Graduate",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },

    number: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    title: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    students: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },

    images: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },

    totalStudents: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    totalWithHonours: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "Graduates",
    timestamps: true,
  }
);
