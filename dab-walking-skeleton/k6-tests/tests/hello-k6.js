import http from "k6/http";
import { check } from "k6";

export const options = {
  vus: 5,
  duration: "10s",
};

export default async () => {
  const user = {
    name: `User ${Math.random()}`,
  };

  const url = "http://traefik:8000/users";
  const res = http.post(url, JSON.stringify(user), {
    headers: {
      "Content-Type": "application/json",
    },
  });

  check(res, {
    "status is 202": (r) => r.status === 202,
  });
};