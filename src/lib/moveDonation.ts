import refreshToken from "@/lib/refreshToken";

const API_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/swayam/move-donation/`;
let AUTH_TOKEN: string | null = "";
type MoveDonationResponse = {
  paymentId: number;
  status: number;
  success: boolean;
  response?: any;
  error?: any;
};

export async function moveDonations(paymentIds: number[], memberId: number, cardFingerPrint?: string): Promise<MoveDonationResponse[] | null> {
  if (typeof window !== "undefined") {
    AUTH_TOKEN = window.sessionStorage.getItem("swayam_jwt_token");
  }
  const results: MoveDonationResponse[] = [];

  for (const paymentId of paymentIds) {
    const body: any = {
      newDonationMember: memberId,
      paymentId: paymentId,
    }
    if (cardFingerPrint != null || cardFingerPrint != undefined || cardFingerPrint != '') {
      body.cardFingerprint = cardFingerPrint
    }
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_TOKEN}`,
        },
        body: JSON.stringify(body),
      });

      let refreshTokenResponse = false;
      if(response.status === 403) {
        refreshTokenResponse = refreshToken();

        if (refreshTokenResponse){
          await moveDonations(paymentIds, memberId, cardFingerPrint)
          return null
        } else {
          results.push({
            paymentId,
            status: 403,
            success: false,
            error: 'Please login again',
          })
        }
      }
      const data = await response.json();

      results.push({
        paymentId,
        status: response.status,
        success: response.ok,
        response: data,
      });
    } catch (error) {
      results.push({
        paymentId,
        status: 0,
        success: false,
        error,
      });
    }
  }

  return results;
}