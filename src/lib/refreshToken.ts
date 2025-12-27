import {useRouter} from "next/navigation";

export default function refreshToken() {
  let userPin = null
  if(typeof window !== "undefined") {
    userPin = window.sessionStorage.getItem('swayam_user_pin')
  }

  if(userPin === null || typeof userPin === undefined){
    return false
  }

  const formData = new URLSearchParams();
  formData.append("grant_type", "client_credentials");
  formData.append("client_id", userPin);
  formData.append("client_secret", userPin);

  fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/public/v1/oauth/token/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log('data', data)
      if (data.error || !data.access_token) {
        return false;
      }
      sessionStorage.setItem("swayam_jwt_token", data.access_token);
    })
    .catch(() => {
      return false;
    });
  return true
}