import axios from "axios";

export const getProfileStats = async () => {
  const token = localStorage.getItem("authToken");

  const res = await axios.get("http://localhost:5000/api/profile/me", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return res.data;
};
