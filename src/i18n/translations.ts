import type { Language } from '../types';

export type TranslationKey =
  | 'appName'
  | 'tagline'
  | 'welcomeBack'
  | 'bengalurian'
  | 'login'
  | 'register'
  | 'logout'
  | 'email'
  | 'password'
  | 'name'
  | 'phone'
  | 'confirmPassword'
  | 'noAccount'
  | 'hasAccount'
  | 'dashboard'
  | 'salons'
  | 'categories'
  | 'aiStylist'
  | 'navigator'
  | 'bookings'
  | 'leaderboard'
  | 'profile'
  | 'panicButton'
  | 'panicDesc'
  | 'findNearest'
  | 'bookNow'
  | 'viewDetails'
  | 'services'
  | 'packages'
  | 'staff'
  | 'rating'
  | 'reviews'
  | 'selectDate'
  | 'selectTime'
  | 'selectStaff'
  | 'paymentMethod'
  | 'cash'
  | 'upi'
  | 'payAtSalon'
  | 'confirmBooking'
  | 'bookingSuccess'
  | 'whatsappSent'
  | 'emailSent'
  | 'history'
  | 'noBookings'
  | 'feedback'
  | 'feedback24h'
  | 'language'
  | 'english'
  | 'hindi'
  | 'kannada'
  | 'hair'
  | 'skin'
  | 'nails'
  | 'spa'
  | 'bridal'
  | 'grooming'
  | 'wellness'
  | 'turnOnCamera'
  | 'analyzeFace'
  | 'faceShape'
  | 'skinTone'
  | 'suggestedColors'
  | 'suggestedStyles'
  | 'adjustColor'
  | 'applySuggestion'
  | 'nearestSalons'
  | 'distance'
  | 'km'
  | 'salonPortal'
  | 'commissionDue'
  | 'payCommission'
  | 'commissionWarning'
  | 'salonRemoved'
  | 'topSalons'
  | 'topStylists'
  | 'leaveReview'
  | 'submit'
  | 'cancel'
  | 'search'
  | 'filter'
  | 'all'
  | 'featured'
  | 'openNow'
  | 'getStarted'
  | 'heroTitle'
  | 'heroSubtitle'
  | 'exploreSalons'
  | 'aiPowered'
  | 'smartNav'
  | 'trustedBy'
  | 'selectServices'
  | 'total'
  | 'minutes'
  | 'saved'
  | 'welcome'
  | 'quickActions'
  | 'upcoming'
  | 'completed'
  | 'rateExperience'
  | 'yourRating'
  | 'writeReview'
  | 'salonOwner'
  | 'monthlyFee'
  | 'deadline'
  | 'gracePeriod'
  | 'activeSalons'
  | 'navigate'
  | 'callSalon'
  | 'shareLocation'
  | 'emergencyStyle'
  | 'home'
  | 'about'
  | 'contact'
  | 'privacy'
  | 'invalidCredentials'
  | 'emailExists'
  | 'passwordMismatch'
  | 'required'
  | 'loading'
  | 'noSalonsFound'
  | 'bookingDetails'
  | 'status'
  | 'confirmed'
  | 'cancelled'
  | 'rebook'
  | 'viewSalon'
  | 'commissionPaid'
  | 'daysLeft'
  | 'payNow'
  | 'salonDashboard'
  | 'selectSalon'
  | 'amountDue'
  | 'lastPaid'
  | 'categoryDesc';

const en: Record<TranslationKey, string> = {
  appName: 'Luxeluru',
  tagline: 'Bengaluru\'s Premier Luxury Salon Experience',
  welcomeBack: 'Welcome back',
  bengalurian: 'Bengalurian',
  login: 'Sign In',
  register: 'Create Account',
  logout: 'Sign Out',
  email: 'Email Address',
  password: 'Password',
  name: 'Full Name',
  phone: 'Phone Number',
  confirmPassword: 'Confirm Password',
  noAccount: 'Don\'t have an account?',
  hasAccount: 'Already have an account?',
  dashboard: 'Dashboard',
  salons: 'Salons',
  categories: 'Categories',
  aiStylist: 'AI Stylr',
  navigator: 'Salon Navigator',
  bookings: 'My Appointments',
  leaderboard: 'Leaderboard',
  profile: 'Profile',
  panicButton: 'Style Emergency',
  panicDesc: 'Need a salon right now? We\'ll find the nearest open luxury salon instantly.',
  findNearest: 'Find Nearest Salon',
  bookNow: 'Book Now',
  viewDetails: 'View Details',
  services: 'Services',
  packages: 'Packages',
  staff: 'Our Artists',
  rating: 'Rating',
  reviews: 'Reviews',
  selectDate: 'Select Date',
  selectTime: 'Select Time',
  selectStaff: 'Preferred Stylist',
  paymentMethod: 'Payment at Salon',
  cash: 'Cash',
  upi: 'UPI',
  payAtSalon: 'Pay at the salon — no online payment required',
  confirmBooking: 'Confirm Appointment',
  bookingSuccess: 'Appointment booked successfully!',
  whatsappSent: 'Confirmation sent via WhatsApp',
  emailSent: 'Confirmation email sent',
  history: 'Appointment History',
  noBookings: 'No appointments yet. Book your first luxury experience!',
  feedback: 'Share Feedback',
  feedback24h: 'Your appointment is confirmed. You can view and manage it in your bookings.',
  language: 'Language',
  english: 'English',
  hindi: 'Hindi',
  kannada: 'Kannada',
  hair: 'Hair & Styling',
  skin: 'Skin Care',
  nails: 'Nails & Manicure',
  spa: 'Spa & Relaxation',
  bridal: 'Bridal & Events',
  grooming: 'Men\'s Grooming',
  wellness: 'Wellness',
  turnOnCamera: 'Enable Camera for AI Analysis',
  analyzeFace: 'Analyze My Features',
  faceShape: 'Face Shape',
  skinTone: 'Skin Tone',
  suggestedColors: 'Suggested Hair Colors',
  suggestedStyles: 'Recommended Styles',
  adjustColor: 'Prefer a different hair colour?',
  applySuggestion: 'Find Salons for This Look',
  nearestSalons: 'Nearest Salons',
  distance: 'Distance',
  km: 'km',
  salonPortal: 'Salon Partner Portal',
  commissionDue: 'Platform Commission Due',
  payCommission: 'Pay 3% Commission',
  commissionWarning: 'Pay by the due date. 5-day grace period applies — unpaid salons are hidden from listings.',
  salonRemoved: 'Salon hidden until commission is cleared',
  topSalons: 'Top Salons',
  topStylists: 'Top Stylists',
  leaveReview: 'Leave a Review',
  submit: 'Submit',
  cancel: 'Cancel',
  search: 'Search salons, services...',
  filter: 'Filter',
  all: 'All',
  featured: 'Featured',
  openNow: 'Open Now',
  getStarted: 'Get Started',
  heroTitle: 'Discover Bengaluru\'s Finest Salons',
  heroSubtitle: 'AI-powered styling, smart navigation, and curated luxury beauty experiences tailored for you.',
  exploreSalons: 'Explore Salons',
  aiPowered: 'AI Stylr',
  smartNav: 'Smart Navigation',
  trustedBy: 'Gaining trust daily across Namma Bengaluru',
  selectServices: 'Select Services',
  total: 'Total',
  minutes: 'min',
  saved: 'You save',
  welcome: 'Welcome',
  quickActions: 'Quick Actions',
  upcoming: 'Upcoming',
  completed: 'Completed',
  rateExperience: 'Rate Your Experience',
  yourRating: 'Your Rating',
  writeReview: 'Write a review (optional)',
  salonOwner: 'Salon Partner Login',
  monthlyFee: 'Monthly Platform Fee (3%)',
  deadline: 'Payment Deadline',
  gracePeriod: 'Grace Period (5 days)',
  activeSalons: 'Active Partner Salons',
  navigate: 'Navigate',
  callSalon: 'Call Salon',
  shareLocation: 'Share Location',
  emergencyStyle: 'Style Emergency — Nearest Salon Found!',
  home: 'Home',
  about: 'About',
  contact: 'Contact',
  privacy: 'Privacy',
  invalidCredentials: 'Invalid email or password',
  emailExists: 'An account with this email already exists',
  passwordMismatch: 'Passwords do not match',
  required: 'This field is required',
  loading: 'Loading...',
  noSalonsFound: 'No salons found nearby',
  bookingDetails: 'Booking Details',
  status: 'Status',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  rebook: 'Book Again',
  viewSalon: 'View Salon',
  commissionPaid: 'Commission Paid',
  daysLeft: 'days left',
  payNow: 'Pay Now',
  salonDashboard: 'Partner Dashboard',
  selectSalon: 'Select Your Salon',
  amountDue: 'Amount Due',
  lastPaid: 'Last Paid',
  categoryDesc: 'Browse salons by specialty',
};

const hi: Record<TranslationKey, string> = {
  ...en,
  tagline: 'बेंगलुरु का प्रीमियम लक्ज़री सैलून अनुभव',
  welcomeBack: 'वापसी पर स्वागत है',
  bengalurian: 'बेंगलुरuvian',
  login: 'साइन इन',
  register: 'खाता बनाएं',
  logout: 'साइन आउट',
  email: 'ईमेल पता',
  password: 'पासवर्ड',
  name: 'पूरा नाम',
  phone: 'फ़ोन नंबर',
  confirmPassword: 'पासवर्ड की पुष्टि',
  noAccount: 'खाता नहीं है?',
  hasAccount: 'पहले से खाता है?',
  dashboard: 'डैशबोर्ड',
  salons: 'सैलून',
  categories: 'श्रेणियाँ',
  aiStylist: 'AI Stylr',
  navigator: 'सैलून नेविगेटर',
  bookings: 'मेरी अपॉइंटमेंट',
  leaderboard: 'लीडरबोर्ड',
  profile: 'प्रोफ़ाइल',
  panicButton: 'स्टाइल Emergency',
  panicDesc: 'अभी सैलून चाहिए? हम तुरंत नज़दीकी लक्ज़री सैलून ढूंढेंगे।',
  findNearest: 'नज़दीकी सैलून खोजें',
  bookNow: 'अभी बुक करें',
  viewDetails: 'विवरण देखें',
  services: 'सेवाएं',
  packages: 'पैकेज',
  staff: 'हमारे कलाकार',
  paymentMethod: 'सैलून में भुगतान',
  cash: 'नकद',
  upi: 'UPI',
  payAtSalon: 'सैलून में भुगतान — ऑनलाइन भुगतान नहीं',
  confirmBooking: 'अपॉइंटमेंट की पुष्टि',
  bookingSuccess: 'अपॉइंटमेंट सफलतापूर्वक बुक!',
  whatsappSent: 'WhatsApp पर पुष्टि भेजी',
  emailSent: 'ईमेल पुष्टि भेजी',
  history: 'अपॉइंटमेंट इतिहास',
  noBookings: 'अभी कोई अपॉइंटमेंट नहीं।',
  feedback: 'प्रतिक्रिया दें',
  feedback24h: 'अपॉइंटमेंट की पुष्टि हो गई है। आप इसे अपनी बुकिंग में देख और प्रबंधित कर सकते हैं।',
  language: 'भाषा',
  english: 'English',
  hindi: 'हिंदी',
  kannada: 'ಕನ್ನಡ',
  hair: 'बाल और स्टाइलिंग',
  skin: 'त्वचा देखभाल',
  nails: 'नाखून',
  spa: 'स्पा',
  bridal: 'शादी और इवेंट',
  grooming: 'पुरुष ग्रूमिंग',
  wellness: 'वेलनेस',
  turnOnCamera: 'AI विश्लेषण के लिए कैमरा चालू करें',
  analyzeFace: 'मेरे फीचर्स का विश्लेषण',
  heroTitle: 'बेंगलुरु के बेहतरीन सैलून खोजें',
  heroSubtitle: 'AI स्टाइलिंग, स्मार्ट नेविगेशन, और लक्ज़री ब्यूटी अनुभव।',
  exploreSalons: 'सैलून देखें',
  getStarted: 'शुरू करें',
  trustedBy: 'नम्मा बेंगलुरु में रोज़ बढ़ता भरोसा',
  search: 'सैलून, सेवाएं खोजें...',
  categoryDesc: 'विशेषता के अनुसार सैलून देखें',
  emergencyStyle: 'स्टाइल Emergency — नज़दीकी सैलून मिला!',
};

const kn: Record<TranslationKey, string> = {
  ...en,
  tagline: 'ಬೆಂಗಳೂರಿನ ಪ್ರೀಮಿಯಂ ಲಕ್ಷರಿ ಸalon ಅನುಭವ',
  welcomeBack: 'ಮರಳಿ ಸ್ವಾಗತ',
  bengalurian: 'ಬೆಂಗಳೂರian',
  login: 'ಸೈನ್ ಇನ್',
  register: 'ಖಾತೆ ರಚಿಸಿ',
  logout: 'ಸೈನ್ ಔಟ್',
  email: 'ಇಮೇಲ್',
  password: 'ಪಾಸ್‌ವರ್ಡ್',
  name: 'ಪೂರ್ಣ ಹೆಸರು',
  phone: 'ಫೋನ್ ಸಂಖ್ಯೆ',
  confirmPassword: 'ಪಾಸ್‌ವರ್ಡ್ ದೃಢೀಕರಿಸಿ',
  noAccount: 'ಖಾತೆ ಇಲ್ಲವೇ?',
  hasAccount: 'ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ?',
  dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
  salons: 'ಸalonಗಳು',
  categories: 'ವರ್ಗಗಳು',
  aiStylist: 'AI Stylr',
  navigator: 'ಸalon ನ್ಯಾವಿಗೇಟರ್',
  bookings: 'ನನ್ನ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು',
  leaderboard: 'ಲೀಡರ್‌ಬೋರ್ಡ್',
  profile: 'ಪ್ರೊಫೈಲ್',
  panicButton: 'ಸ್ಟೈಲ್ Emergency',
  panicDesc: 'ಈಗ ಸalon ಬೇಕೇ? ಹತ್ತಿರದ ಲಕ್ಷರಿ ಸalon ತಕ್ಷಣ ಕಂಡುಹಿಡಿಯುತ್ತೇವೆ.',
  findNearest: 'ಹತ್ತಿರದ ಸalon ಹುಡುಕಿ',
  bookNow: 'ಈಗ ಬುಕ್ ಮಾಡಿ',
  viewDetails: 'ವಿವರಗಳು',
  services: 'ಸೇವೆಗಳು',
  packages: 'ಪ್ಯಾಕೇಜ್‌ಗಳು',
  staff: 'ನಮ್ಮ ಕಲಾವಿದರು',
  paymentMethod: 'ಸalonನಲ್ಲಿ ಪಾವತಿ',
  cash: 'ನಗದು',
  upi: 'UPI',
  payAtSalon: 'ಸalonನಲ್ಲಿ ಪಾವತಿ — ಆನ್‌ಲೈನ್ ಪಾವತಿ ಅಲ್ಲ',
  confirmBooking: 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ದೃಢೀಕರಿಸಿ',
  bookingSuccess: 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಯಶಸ್ವಿಯಾಗಿ ಬುಕ್!',
  whatsappSent: 'WhatsApp ನಲ್ಲಿ ದೃಢೀಕರಣ ಕಳುಹಿಸಲಾಗಿದೆ',
  emailSent: 'ಇಮೇಲ್ ದೃಢೀಕರಣ ಕಳುಹಿಸಲಾಗಿದೆ',
  history: 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಇತಿಹಾಸ',
  noBookings: 'ಇನ್ನೂ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳಿಲ್ಲ.',
  feedback: 'ಪ್ರತಿಕ್ರಿಯೆ ನೀಡಿ',
  feedback24h: 'ನಿಮ್ಮ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ದೃಢೀಕರಿಸಲಾಗಿದೆ. ನೀವು ಅದನ್ನು ನಿಮ್ಮ ಬುಕಿಂಗ್‌ಗಳಲ್ಲಿ ವೀಕ್ಷಿಸಬಹುದು ಮತ್ತು ನಿರ್ವಹಿಸಬಹುದು.',
  language: 'ಭಾಷೆ',
  english: 'English',
  hindi: 'हिंदी',
  kannada: 'ಕನ್ನಡ',
  hair: 'ಕೇಶ ಮತ್ತು ಸ್ಟೈಲಿಂಗ್',
  skin: 'ಚರ್ಮ ಸಂರಕ್ಷಣೆ',
  nails: 'ಉಗುರು ಸೇವೆಗಳು',
  spa: 'ಸ್ಪಾ',
  bridal: 'ಮದುವೆ ಮತ್ತು ಈವೆಂಟ್',
  grooming: 'ಪುರುಷ Grooming',
  wellness: 'ವೆಲ್‌ನೆಸ್',
  turnOnCamera: 'AI ವಿಶ್ಲೇಷಣೆಗೆ ಕ್ಯಾಮೆರಾ ಸಕ್ರಿಯಗೊಳಿಸಿ',
  analyzeFace: 'ನನ್ನ ಲಕ್ಷಣಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಿ',
  heroTitle: 'ಬೆಂಗಳೂರಿನ ಅತ್ಯುತ್ತಮ ಸalonಗಳನ್ನು ಕಂಡುಹಿಡಿಯಿರಿ',
  heroSubtitle: 'AI ಸ್ಟೈಲಿಂಗ್, ಸ್ಮಾರ್ಟ್ ನ್ಯಾವಿಗೇಶನ್, ಮತ್ತು ಲಕ್ಷರಿ ಬ್ಯೂಟಿ.',
  exploreSalons: 'ಸalonಗಳನ್ನು ಅನ್ವೇಷಿಸಿ',
  getStarted: 'ಪ್ರಾರಂಭಿಸಿ',
  trustedBy: 'ನಮ್ಮ ಬೆಂಗಳೂರಿನಲ್ಲಿ ಪ್ರತಿದಿನ ಬೆಳೆಯುತ್ತಿರುವ ನಂಬಿಕೆ',
  search: 'ಸalon, ಸೇವೆಗಳನ್ನು ಹುಡುಕಿ...',
  categoryDesc: 'ವಿಶೇಷತೆಯಿಂದ ಸalonಗಳನ್ನು ಬ್ರೌಸ್ ಮಾಡಿ',
  emergencyStyle: 'ಸ್ಟೈಲ್ Emergency — ಹತ್ತಿರದ ಸalon ಸಿಕ್ಕಿತು!',
};

export const translations: Record<Language, Record<TranslationKey, string>> = {
  en,
  hi,
  kn,
};

export function t(lang: Language, key: TranslationKey): string {
  return translations[lang][key] ?? translations.en[key] ?? key;
}
