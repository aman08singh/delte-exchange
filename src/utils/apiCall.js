import axios from "axios";

export async function apiCall(type, url) {
  if (type.toLowerCase() === "get") {
    return axios(url);
  }
}
