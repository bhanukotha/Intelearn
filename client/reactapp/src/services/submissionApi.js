import axios from "axios";

const API_URL = "http://localhost:5000/api/submissions/submit";

export const submitSolution = async (data) => {
  const res = await axios.post(API_URL, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("authToken")}`
    }
  });
  return res.data;
};
