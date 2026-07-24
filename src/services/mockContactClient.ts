// Mock contact service — replace the implementation of `submitContactForm` with
// a real `request(...)` call (from tslApi) when the backend is ready.
// No UI components require modification when switching to the production API.
//
// Future endpoint: POST /api/v1/contact

export interface ContactPayload {
  fullName: string
  email: string
  phone: string
  companyName: string
  message: string
}

export interface ContactResponse {
  success: boolean
  message: string
}

/**
 * Simulates a POST /api/contact request with a 1 500 ms delay.
 *
 * To wire up the real backend, replace this function body with:
 *   return request<ContactResponse>('/api/v1/contact', 'POST', payload, false)
 */
export async function submitContactForm(payload: ContactPayload): Promise<ContactResponse> {
  await new Promise<void>((resolve) => setTimeout(resolve, 1500))

  // Simulate a successful response.
  // To test error behaviour, uncomment the block below and comment out the success return.
  //
  // return {
  //   success: false,
  //   message: 'Something went wrong.',
  // }

  return {
    success: true,
    message: 'Your message has been sent successfully.',
  }
}
