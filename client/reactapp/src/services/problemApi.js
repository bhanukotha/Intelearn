import axios from "axios";

const API_URL = "http://localhost:5000/api/problems";

const getAuthHeader = () => {
  const token = localStorage.getItem("authToken");

  if (!token) {
    throw new Error("No auth token found");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

export const getProblems = async () => {
  const response = await axios.get(API_URL, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const getProblemById = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};
