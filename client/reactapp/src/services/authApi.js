// client/reactapp/src/services/authApi.js

import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api/auth",
});

export const signup = async (formData) => {
  const res = await API.post("/register", {
    name: formData.name,
    email: formData.email,
    guardianEmail: formData.guardianEmail,
    guardianPhone: formData.guardianPhone,
    password: formData.password,
    role: "student"
  });
  return res.data;
};

export const login = async (formData) => {
  const res = await API.post("/login", {
    email: formData.email,
    password: formData.password,
    role: formData.role
  });
  return res.data;
};
