export function sendWhatsAppConfirmation(
  phone: string,
  salonName: string,
  date: string,
  time: string,
  services: string[]
): void {
  const message = encodeURIComponent(
    `✨ Luxeluru Appointment Confirmed!\n\n` +
    `Salon: ${salonName}\n` +
    `Date: ${date}\n` +
    `Time: ${time}\n` +
    `Services: ${services.join(', ')}\n\n` +
    `Payment at salon (Cash/UPI). See you soon!`
  );
  const cleanPhone = phone.replace(/\D/g, '');
  const waPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  window.open(`https://wa.me/${waPhone}?text=${message}`, '_blank');
}

export function sendWhatsAppFeedback(
  phone: string,
  salonName: string,
  bookingId: string
): void {
  const message = encodeURIComponent(
    `Hi from Luxeluru! 🌟\n\n` +
    `It's been 24 hours since your visit to ${salonName}. ` +
    `We'd love your feedback!\n\n` +
    `Rate your experience: https://luxeluru.in/feedback/${bookingId}\n\n` +
    `Reply with 1-5 stars and optional comments.`
  );
  const cleanPhone = phone.replace(/\D/g, '');
  const waPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  window.open(`https://wa.me/${waPhone}?text=${message}`, '_blank');
}

export function sendEmailConfirmation(
  email: string,
  salonName: string,
  date: string,
  time: string,
  services: string[],
  total: number
): void {
  const subject = encodeURIComponent(`Luxeluru — Appointment Confirmed at ${salonName}`);
  const body = encodeURIComponent(
    `Dear Valued Guest,\n\n` +
    `Your appointment has been confirmed!\n\n` +
    `Salon: ${salonName}\n` +
    `Date: ${date}\n` +
    `Time: ${time}\n` +
    `Services: ${services.join(', ')}\n` +
    `Estimated Total: ₹${total.toLocaleString('en-IN')}\n\n` +
    `Payment Method: At salon (Cash or UPI)\n\n` +
    `Thank you for choosing Luxeluru.\n\n` +
    `Warm regards,\nThe Luxeluru Team`
  );
  window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
}

export function scheduleFeedbackRequest(
  bookingId: string,
  salonName: string,
  phone: string,
  onTrigger: () => void
): void {
  const key = `luxeluru_feedback_${bookingId}`;
  if (localStorage.getItem(key)) return;

  const delay = import.meta.env.DEV ? 15000 : 24 * 60 * 60 * 1000;
  setTimeout(() => {
    localStorage.setItem(key, 'sent');
    sendWhatsAppFeedback(phone, salonName, bookingId);
    onTrigger();
  }, delay);
}
