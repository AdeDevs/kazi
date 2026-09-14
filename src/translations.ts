export type Language = 'English (Nigeria)' | 'Yorùbá (Yoruba)' | 'Igbo' | 'Hausa' | 'French (Français)';

export const SUPPORTED_LANGUAGES: Language[] = [
  'English (Nigeria)',
  'Yorùbá (Yoruba)',
  'Igbo',
  'Hausa',
  'French (Français)'
];

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  'English (Nigeria)': {
    // Navigation & AppShell
    'app.title': 'KaziHub',
    'nav.home': 'Home',
    'nav.bookings': 'Bookings',
    'nav.jobs': 'Jobs',
    'nav.messages': 'Messages',
    'nav.notifications': 'Notifications',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    'nav.logout': 'Log Out',
    'role.customer': 'Customer Portal',
    'role.professional': 'Artisan Portal',
    'role.switch_to_pro': 'Switch to Artisan Mode',
    'role.switch_to_customer': 'Switch to Customer Mode',
    
    // Account Hub / ProfileView
    'profile.title': 'Account Hub',
    'profile.subtitle': 'Manage your profile, preferences, security, and account settings.',
    'profile.verified_customer': 'Verified Customer',
    'profile.customer_since': 'Customer since',
    'profile.change_photo': 'Change Photo',
    'profile.edit_profile': 'Edit Profile',
    'profile.upload_photo': 'Upload Photo',
    'profile.take_photo': 'Take Photo',
    
    // Personal Info
    'personal.title': 'Personal Information',
    'personal.subtitle': 'Your essential contact details on KaziHub',
    'personal.full_name': 'Full Name',
    'personal.phone': 'Phone Number',
    'personal.email': 'Email Address',
    'personal.location': 'Primary Location',
    'personal.edit': 'Edit',
    
    // Preferences
    'pref.title': 'Preferences',
    'pref.subtitle': 'Notifications, language, and display appearance',
    'pref.push_notif': 'Push Notifications',
    'pref.push_sub': 'Booking status, chat messages & quote alerts',
    'pref.email_alerts': 'Email Alerts',
    'pref.email_sub': 'Escrow receipts & weekly service summaries',
    'pref.language': 'Language',
    'pref.appearance': 'Appearance',
    'pref.dark_mode': 'Dark Mode',
    'pref.light_mode': 'Light Mode',
    'pref.current_theme': 'Current theme',

    // Privacy & Security
    'security.title': 'Privacy & Security',
    'security.subtitle': 'Password management, authentication, and data privacy',
    'security.password': 'Password',
    'security.password_sub': 'Change your password and login credentials',
    'security.2fa': 'Two-Factor Authentication (2FA)',
    'security.2fa_sub': 'SMS / OTP verification required on login',
    'security.visibility': 'Privacy & Profile Visibility',
    'security.protected': 'Protected',
    'security.change_password': 'Change Password',

    // Help & Support
    'help.title': 'Help & Support',
    'help.subtitle': 'FAQs, customer support concierge & resolution center',
    'help.center': 'Help Center & FAQs',
    'help.center_sub': 'Guides on bookings, escrow payment & artisan warranties',
    'help.contact': 'Contact Support',
    'help.contact_sub': 'Reach our 24/7 KaziHub Trust & Safety team',
    'help.requests': 'Support Requests',
    'help.requests_sub': 'View active disputes & past resolution tickets',

    // Legal
    'legal.title': 'Legal',
    'legal.subtitle': 'Terms of service & privacy compliance policies',
    'legal.terms': 'Terms of Service',
    'legal.terms_sub': 'Platform terms, escrow agreement & warranty rules',
    'legal.privacy': 'Privacy Policy',
    'legal.privacy_sub': 'NDPR compliant data handling & user protection',

    // Account Actions
    'actions.title': 'Account Actions',
    'actions.subtitle': 'Logout session or permanently close account',
    'actions.logout': 'Log Out',
    'actions.delete': 'Delete Account',

    // Modals & Common Controls
    'modal.select_language': 'Select Language',
    'modal.choose_language': 'Choose your preferred app language.',
    'modal.save_changes': 'Save Changes',
    'modal.cancel': 'Cancel',
    'modal.update_password': 'Update Password',
    'modal.current_password': 'Current Password',
    'modal.new_password': 'New Password',
    'modal.confirm_password': 'Confirm New Password',
    
    // Customer Dashboard / Explore
    'explore.hero_title': 'Find Vetted Artisans Near You',
    'explore.hero_sub': 'Book verified electricians, plumbers, carpenters & solar techs with escrow protection.',
    'explore.search_placeholder': 'Search electricians, plumbers, carpenters, solar technicians...',
    'explore.all_categories': 'All Categories',
    'explore.book_now': 'Book Now',
    'explore.request_quote': 'Request Quote',
    'explore.active_jobs': 'Active Jobs',
    'explore.all_jobs': 'All Jobs',
    'explore.awaiting_completion': 'Awaiting Completion',
    'explore.completed': 'Completed',
    'explore.issue_reported': 'Issue Reported',
    'explore.closed': 'Closed',
    'explore.rate_review': 'Rate & Review',
    'explore.confirm_completion': 'Confirm Completion',
    'explore.cancel_booking': 'Cancel Booking',
    'explore.chat': 'Chat',
  },

  'Yorùbá (Yoruba)': {
    // Navigation & AppShell
    'app.title': 'KaziHub',
    'nav.home': 'Ile (Home)',
    'nav.bookings': 'Awon Iwe-Afe',
    'nav.jobs': 'Ise Awon Onise',
    'nav.messages': 'Awon Inanwo / Atagba',
    'nav.notifications': 'Awon Ikilọ',
    'nav.profile': 'Profaili mi',
    'nav.settings': 'Awon Eto',
    'nav.logout': 'Jade (Log Out)',
    'role.customer': 'Oju-Ewe Onibara',
    'role.professional': 'Oju-Ewe Onise-Owo',
    'role.switch_to_pro': 'Yipada si Ipò Onise-Owo',
    'role.switch_to_customer': 'Yipada si Ipò Onibara',

    // Account Hub / ProfileView
    'profile.title': 'Ibùdó Akọọlẹ (Account Hub)',
    'profile.subtitle': 'Tọju profaili rẹ, awọn eto, abo, ati awọn eto akọọlẹ rẹ.',
    'profile.verified_customer': 'Onibara ti a fọwọsi',
    'profile.customer_since': 'Onibara latigba',
    'profile.change_photo': 'Pààrọ̀ Aaworan',
    'profile.edit_profile': 'Ṣatunkọ Profaili',
    'profile.upload_photo': 'Gbe Aaworan Soke',
    'profile.take_photo': 'Yaworan Tuntun',

    // Personal Info
    'personal.title': 'Awon Alaye Eniyan',
    'personal.subtitle': 'Awọn alaye kànṣaṣa rẹ lori KaziHub',
    'personal.full_name': 'Arukọ Lẹkunrẹrẹ',
    'personal.phone': 'Nọmba Foonu',
    'personal.email': 'Abalaye Email',
    'personal.location': 'Agbegbe Re',
    'personal.edit': 'Ṣatunkọ',

    // Preferences
    'pref.title': 'Awọn Eto Fẹran (Preferences)',
    'pref.subtitle': 'Awọn ikilọ, ede, ati irisi aworan',
    'pref.push_notif': 'Awọn Ikilọ Foonu (Push)',
    'pref.push_sub': 'Iwe-afe, aworan ise ati alaye idiellẹ',
    'pref.email_alerts': 'Awon Ikilọ Email',
    'pref.email_sub': 'Awon iwe-owo escrow ati akobiao ose',
    'pref.language': 'Èdè (Language)',
    'pref.appearance': 'Irisi Àwọ̀ (Appearance)',
    'pref.dark_mode': 'Ipò Òkùnkùn (Dark)',
    'pref.light_mode': 'Ipò Imole (Light)',
    'pref.current_theme': 'Irisi Lọwọlọwọ',

    // Privacy & Security
    'security.title': 'Abo ati Asiri (Privacy & Security)',
    'security.subtitle': 'Tọju ọrọ-asiri ati idabobo data rẹ',
    'security.password': 'Ọrọ-Asiri (Password)',
    'security.password_sub': 'Paarọ ọrọ-asiri ati awọn alaye wọle rẹ',
    'security.2fa': 'Abo Onana Meji (2FA)',
    'security.2fa_sub': 'Abo foonu / OTP lati wo inu akọọlẹ',
    'security.visibility': 'Asiri ati Irisi Profaili',
    'security.protected': 'A ti dabobo',
    'security.change_password': 'Paarọ Ọrọ-Asiri',

    // Help & Support
    'help.title': 'Ipadabọ & Iranlọwọ',
    'help.subtitle': 'Awon ibeere ati ẹgbẹ atilẹyin KaziHub',
    'help.center': 'Ibùdó Iranlọwọ & FAQs',
    'help.center_sub': 'Itọsọna lori iwe-aṣẹ, escrow ati atilẹyin',
    'help.contact': 'Aba Atilẹyin Sọ̀rọ̀',
    'help.contact_sub': 'Pade ẹgbẹ abo KaziHub 24/7',
    'help.requests': 'Awon Atilẹyin Rẹ',
    'help.requests_sub': 'Wo awọn iṣoro ti o wa ati iroyin',

    // Legal
    'legal.title': 'Awon Ofin (Legal)',
    'legal.subtitle': 'Ofin lilo ati asiri data',
    'legal.terms': 'Ofin Agbese KaziHub',
    'legal.terms_sub': 'Ofin escrow ati idabobo onibara',
    'legal.privacy': 'Ofin Asiri Data',
    'legal.privacy_sub': 'Idabobo alaye onibara labẹ NDPR',

    // Account Actions
    'actions.title': 'Gbé Igbesẹ Akọọlẹ',
    'actions.subtitle': 'Jade kuro ni akọọlẹ tabi pa run titi lae',
    'actions.logout': 'Jade (Log Out)',
    'actions.delete': 'Pa Akọọlẹ Run (Delete Account)',

    // Modals & Common Controls
    'modal.select_language': 'Yan Èdè Rẹ (Select Language)',
    'modal.choose_language': 'Mú èdè ti o fẹ́ lórí KaziHub.',
    'modal.save_changes': 'Tọju Awọn Yipada',
    'modal.cancel': 'Sọ Nu (Cancel)',
    'modal.update_password': 'Pààrọ̀ Ọrọ-Asiri',
    'modal.current_password': 'Ọrọ-Asiri Lọwọlọwọ',
    'modal.new_password': 'Ọrọ-Asiri Tuntun',
    'modal.confirm_password': 'Muu Ọrọ-Asiri Daju',

    // Customer Dashboard / Explore
    'explore.hero_title': 'Wa Awọn Onise-Owo Ti A Fọwọsi Nitosi Rẹ',
    'explore.hero_sub': 'Book awon onina, agbebi, gbena ati solar pelu aboo escrow.',
    'explore.search_placeholder': 'Wa electrician, plumber, carpenter, solar tech...',
    'explore.all_categories': 'Gbogbo Ise',
    'explore.book_now': 'Book Nisin',
    'explore.request_quote': 'Tọrọ Mutatọ / Quote',
    'explore.active_jobs': 'Awọn Iṣẹ TI O Lọ lowolowo',
    'explore.all_jobs': 'Gbogbo Iṣẹ',
    'explore.awaiting_completion': 'Duro De Agbaye',
    'explore.completed': 'Iṣẹ Ti A Ṣe Tan',
    'explore.issue_reported': 'Iṣoro Wa',
    'explore.closed': 'Ti De Wa',
    'explore.rate_review': 'Fun ni Staa & Igbelewon',
    'explore.confirm_completion': 'Muu Daju Pe O Pari',
    'explore.cancel_booking': 'Fagilee Iwe-Afe',
    'explore.chat': 'Sọrọ Pelu Onise',
  },

  'Igbo': {
    // Navigation & AppShell
    'app.title': 'KaziHub',
    'nav.home': 'Ụlọ (Home)',
    'nav.bookings': 'Akwụkwọ Ọrụ',
    'nav.jobs': 'Ọrụ Ndi Nka',
    'nav.messages': 'Ozi (Messages)',
    'nav.notifications': 'Ọkwa (Notifications)',
    'nav.profile': 'Profaịlụ M',
    'nav.settings': 'Ntọala (Settings)',
    'nav.logout': 'Pụọ (Log Out)',
    'role.customer': 'Mpaghara Onye Ahịa',
    'role.professional': 'Mpaghara Onye Nka',
    'role.switch_to_pro': 'Gbanwee gaa Mpaghara Onye Nka',
    'role.switch_to_customer': 'Gbanwee gaa Mpaghara Onye Ahịa',

    // Account Hub / ProfileView
    'profile.title': 'Mpaghara Akaụntụ (Account Hub)',
    'profile.subtitle': 'Jikwaa profaịlụ gị, ntọala, nchekwa, na akaụntụ gị.',
    'profile.verified_customer': 'Onye Ahịa Ahụrụ Anya',
    'profile.customer_since': 'Onye ahịa kemgbe',
    'profile.change_photo': 'Gbanwee Foto',
    'profile.edit_profile': 'Ozi Profaịlụ',
    'profile.upload_photo': 'Sụgharịa Foto',
    'profile.take_photo': 'Pịa Foto',

    // Personal Info
    'personal.title': 'Ozi Onwe Gị',
    'personal.subtitle': 'Ozi kọntaktị gị dị mkpa na KaziHub',
    'personal.full_name': 'Aha Zuorunzuo',
    'personal.phone': 'Nọmba Ekwentị',
    'personal.email': 'Imeelụ',
    'personal.location': 'Ebe I Bi',
    'personal.edit': 'Dezie',

    // Preferences
    'pref.title': 'Ihe Ndị I Hụrụ N’Anya (Preferences)',
    'pref.subtitle': 'Ọkwa, asụsụ, na anya ihu',
    'pref.push_notif': 'Ọkwa Ekwentị (Push)',
    'pref.push_sub': 'Ọkwa ọrụ, ozi na ọnụahịa',
    'pref.email_alerts': 'Ọkwa Imeelụ',
    'pref.email_sub': 'Eziokwu ego escrow na nchịkọta',
    'pref.language': 'Asụsụ (Language)',
    'pref.appearance': 'Ọdịdị (Appearance)',
    'pref.dark_mode': 'Ọchịchịrị (Dark)',
    'pref.light_mode': 'Ihie (Light)',
    'pref.current_theme': 'Ọdịdị Ugbu A',

    // Privacy & Security
    'security.title': 'Nchekwube & Nzuzo',
    'security.subtitle': 'Nchekwa okwu sirii na data gị',
    'security.password': 'Okwu Sirii (Password)',
    'security.password_sub': 'Gbanwee okwu sirii gị',
    'security.2fa': 'Nchekwa Uzo Abụọ (2FA)',
    'security.2fa_sub': 'Akwụkwọ nyocha SMS mgbe ị na-abanye',
    'security.visibility': 'Nzuzo Profaịlụ',
    'security.protected': 'A Chekwara Onwe Gị',
    'security.change_password': 'Gbanwee Okwu Sirii',

    // Help & Support
    'help.title': 'Nkwado & Enyemaka',
    'help.subtitle': 'Ajụjụ na ndị otu KaziHub',
    'help.center': 'Ebe Enyemaka & FAQs',
    'help.center_sub': 'Ihe nduzi gbasara escrow na ọrụ nka',
    'help.contact': 'Gwa Ndị Nkwado Okwu',
    'help.contact_sub': 'Ndị otu KaziHub awa 24/7',
    'help.requests': 'Ihe I Arịọrọ',
    'help.requests_sub': 'Lụọ anya na nsogbu ndị dị ugbu a',

    // Legal
    'legal.title': 'Iwu KaziHub',
    'legal.subtitle': 'Iwu ojiji na nchekwa data',
    'legal.terms': 'Skim Ojiji KaziHub',
    'legal.terms_sub': 'Iwu escrow na nchekwa ndị ahịa',
    'legal.privacy': 'Iwu Nzuzo Data',
    'legal.privacy_sub': 'Nchekwa data dịka NDPR siri kwuo',

    // Account Actions
    'actions.title': 'Omume Akaụntụ',
    'actions.subtitle': 'Pụọ ma ọ bụ hichapụ akaụntụ gị kpamkpam',
    'actions.logout': 'Pụọ (Log Out)',
    'actions.delete': 'Hichapụ Akaụntụ (Delete Account)',

    // Modals & Common Controls
    'modal.select_language': 'Nọrọ Asụsụ Gị (Select Language)',
    'modal.choose_language': 'Họrọ asụsụ ị chọrọ iji na KaziHub.',
    'modal.save_changes': 'Chekwaa Hụ',
    'modal.cancel': 'Kagbuo (Cancel)',
    'modal.update_password': 'Gbanwee Okwu Sirii',
    'modal.current_password': 'Okwu Sirii Ugbu A',
    'modal.new_password': 'Okwu Sirii Ọhụrụ',
    'modal.confirm_password': 'Kwere Okwu Sirii',

    // Customer Dashboard / Explore
    'explore.hero_title': 'Chọta Ndị Nka Ahụrụ Anya Nso Gị',
    'explore.hero_sub': 'Sọgharịa ndị mechanic, electrician, plumber na solar.',
    'explore.search_placeholder': 'Chọọ electrician, plumber, carpenter...',
    'explore.all_categories': 'Ọrụ Niile',
    'explore.book_now': 'Rịọ Ugbu A',
    'explore.request_quote': 'Rịọ Ọnụahịa (Quote)',
    'explore.active_jobs': 'Ọrụ Na-aga N’iru',
    'explore.all_jobs': 'Ọrụ Niile',
    'explore.awaiting_completion': 'Na-eche Mgbe A Ga-emecha',
    'explore.completed': 'Emechara Ọrụ',
    'explore.issue_reported': 'Nwere Nsogbu',
    'explore.closed': 'Emechiri',
    'explore.rate_review': 'Nye Kpakpando (Rate)',
    'explore.confirm_completion': 'Kwere Na Emechara',
    'explore.cancel_booking': 'Kagbuo Ọrụ',
    'explore.chat': 'Sụọ Ozi',
  },

  'Hausa': {
    // Navigation & AppShell
    'app.title': 'KaziHub',
    'nav.home': 'Gida (Home)',
    'nav.bookings': 'Ayyukan da Aka Yi Book',
    'nav.jobs': 'Ayyukan Maikera',
    'nav.messages': 'Sakonni (Messages)',
    'nav.notifications': 'Sanarwa (Notifications)',
    'nav.profile': 'Shafi na (Profile)',
    'nav.settings': 'Saituna (Settings)',
    'nav.logout': 'Fita (Log Out)',
    'role.customer': 'Bangarori na Mai Saye',
    'role.professional': 'Bangarori na Maikera',
    'role.switch_to_pro': 'Koma Yanayin Maikera',
    'role.switch_to_customer': 'Koma Yanayin Mai Saye',

    // Account Hub / ProfileView
    'profile.title': 'Dakin Account (Account Hub)',
    'profile.subtitle': 'Gudanar da profile dinka, saiti, tsaro da asusunka.',
    'profile.verified_customer': 'Kastoma Mai Tabbatuwa',
    'profile.customer_since': 'Kastoma tun daga',
    'profile.change_photo': 'Sauya Hoto',
    'profile.edit_profile': 'Gyara Profile',
    'profile.upload_photo': 'Saka Hoto',
    'profile.take_photo': 'Dauki Hoto',

    // Personal Info
    'personal.title': 'Bayananka na Kanka',
    'personal.subtitle': 'Cikakken bayanin sadarwa a KaziHub',
    'personal.full_name': 'Cikakken Suna',
    'personal.phone': 'Lambar Waya',
    'personal.email': 'Atereshin Email',
    'personal.location': 'Mazaunanka',
    'personal.edit': 'Gyara',

    // Preferences
    'pref.title': 'Abin da Kake So (Preferences)',
    'pref.subtitle': 'Sanarwa, harshe da bayyanar shafi',
    'pref.push_notif': 'Sanarwar Waya (Push)',
    'pref.push_sub': 'Sanarwar ayyuka, sakonni da farashi',
    'pref.email_alerts': 'Sanarwar Email',
    'pref.email_sub': 'Bayanai na escrow da takaitaccen aiki',
    'pref.language': 'Harshe (Language)',
    'pref.appearance': 'Kayan Ciki (Appearance)',
    'pref.dark_mode': 'Yanayin Duhu (Dark)',
    'pref.light_mode': 'Yanayin Haske (Light)',
    'pref.current_theme': 'Yanayin Yanzu',

    // Privacy & Security
    'security.title': 'Tsaro da Sirri',
    'security.subtitle': 'Tsaron kalmar sirri da bayanan asusu',
    'security.password': 'Kalmar Sirri (Password)',
    'security.password_sub': 'Sauya kalmar sirrinka da shiga',
    'security.2fa': 'Tsaro Hanyoyi Biyu (2FA)',
    'security.2fa_sub': 'Shigar da lamba OTP ta SMS lokacin shiga',
    'security.visibility': 'Ganuwar Profile',
    'security.protected': 'An Kare Bayananka',
    'security.change_password': 'Sauya Kalmar Sirri',

    // Help & Support
    'help.title': 'Taimako & Taimakon Abokan Ciniki',
    'help.subtitle': 'Tambayoyi da cibiyar taimako ta KaziHub',
    'help.center': 'Cibiyar Taimako & FAQs',
    'help.center_sub': 'Bayanai akan escrow da garantin kera',
    'help.contact': 'Sadarwa da Taimako',
    'help.contact_sub': 'Tuntubi \'yan kwamitin KaziHub 24/7',
    'help.requests': 'Ayyukan Taimakonka',
    'help.requests_sub': 'Duba damuwar da aka shigar',

    // Legal
    'legal.title': 'Dokoki da Yarjejeniya',
    'legal.subtitle': 'Tsarin amfani da kare sirrin bayanai',
    'legal.terms': 'Sharudan Amfani',
    'legal.terms_sub': 'Dokokin amfani da tsarin biyan kudi escrow',
    'legal.privacy': 'Manufar Kare Sirri',
    'legal.privacy_sub': 'Dokokin kare bayanai karkashin NDPR',

    // Account Actions
    'actions.title': 'Ayyukan Asusu',
    'actions.subtitle': 'Fita daga asusunka ko goge shi baki daya',
    'actions.logout': 'Fita (Log Out)',
    'actions.delete': 'Goge Account (Delete Account)',

    // Modals & Common Controls
    'modal.select_language': 'Zabi Harshenka (Select Language)',
    'modal.choose_language': 'Zabi harshen da kake son amfani da shi a KaziHub.',
    'modal.save_changes': 'Ajiye Gyara',
    'modal.cancel': 'Soke (Cancel)',
    'modal.update_password': 'Sabunta Kalmar Sirri',
    'modal.current_password': 'Kalmar Sirri ta Yanzu',
    'modal.new_password': 'Sabuwar Kalmar Sirri',
    'modal.confirm_password': 'Tabbatar da Kalmar Sirri',

    // Customer Dashboard / Explore
    'explore.hero_title': 'Nemo Gwani Maikera Kusa da Kai',
    'explore.hero_sub': 'Yi booking din \'yan wutar lantarki, falanba, da masu solar da tsaron escrow.',
    'explore.search_placeholder': 'Nemi mai wutar lantarki, falanba, kafinta...',
    'explore.all_categories': 'Dukkan Ayyuka',
    'explore.book_now': 'Pasa Booking Yanzu',
    'explore.request_quote': 'Nemi Farashi (Quote)',
    'explore.active_jobs': 'Ayyukan da ke Kansa',
    'explore.all_jobs': 'Dukkan Ayyuka',
    'explore.awaiting_completion': 'Matafiyar Kammalawa',
    'explore.completed': 'Gammala Aiki',
    'explore.issue_reported': 'Akwai Matsala',
    'explore.closed': 'An Rufe',
    'explore.rate_review': 'Ba Da Tauraro (Rate)',
    'explore.confirm_completion': 'Tabbatar An Kammala',
    'explore.cancel_booking': 'Soke Booking',
    'explore.chat': 'Yi Magana',
  },

  'French (Français)': {
    // Navigation & AppShell
    'app.title': 'KaziHub',
    'nav.home': 'Accueil',
    'nav.bookings': 'Réservations',
    'nav.jobs': 'Missions',
    'nav.messages': 'Messages',
    'nav.notifications': 'Notifications',
    'nav.profile': 'Mon Profil',
    'nav.settings': 'Paramètres',
    'nav.logout': 'Se Déconnecter',
    'role.customer': 'Portail Client',
    'role.professional': 'Portail Artisan',
    'role.switch_to_pro': 'Passer au Mode Artisan',
    'role.switch_to_customer': 'Passer au Mode Client',

    // Account Hub / ProfileView
    'profile.title': 'Centre de Compte',
    'profile.subtitle': 'Gérez votre profil, vos préférences, votre sécurité et vos paramètres.',
    'profile.verified_customer': 'Client Vérifié',
    'profile.customer_since': 'Client depuis',
    'profile.change_photo': 'Changer la photo',
    'profile.edit_profile': 'Modifier le profil',
    'profile.upload_photo': 'Importer une photo',
    'profile.take_photo': 'Prendre une photo',

    // Personal Info
    'personal.title': 'Informations Personnelles',
    'personal.subtitle': 'Vos coordonnées essentielles sur KaziHub',
    'personal.full_name': 'Nom complet',
    'personal.phone': 'Numéro de téléphone',
    'personal.email': 'Adresse e-mail',
    'personal.location': 'Localisation principale',
    'personal.edit': 'Modifier',

    // Preferences
    'pref.title': 'Préférences',
    'pref.subtitle': 'Notifications, langue et apparence d\'affichage',
    'pref.push_notif': 'Notifications Push',
    'pref.push_sub': 'Statut des réservations, messages et devis',
    'pref.email_alerts': 'Alertes E-mail',
    'pref.email_sub': 'Reçus séquestre et résumés hebdomadaires',
    'pref.language': 'Langue',
    'pref.appearance': 'Apparence',
    'pref.dark_mode': 'Mode Sombre',
    'pref.light_mode': 'Mode Clair',
    'pref.current_theme': 'Thème actuel',

    // Privacy & Security
    'security.title': 'Confidentialité & Sécurité',
    'security.subtitle': 'Gestion des mots de passe, authentification et confidentialité',
    'security.password': 'Mot de passe',
    'security.password_sub': 'Changer votre mot de passe et identifiants',
    'security.2fa': 'Authentification à deux facteurs (2FA)',
    'security.2fa_sub': 'Vérification SMS / OTP requise à la connexion',
    'security.visibility': 'Confidentialité du profil',
    'security.protected': 'Protégé',
    'security.change_password': 'Changer le mot de passe',

    // Help & Support
    'help.title': 'Aide & Support',
    'help.subtitle': 'FAQ, conciergerie support client et résolution',
    'help.center': 'Centre d\'aide & FAQ',
    'help.center_sub': 'Guides sur les réservations, le paiement séquestre et garanties',
    'help.contact': 'Contacter le support',
    'help.contact_sub': 'Joignez l\'équipe KaziHub 24/7',
    'help.requests': 'Demandes de support',
    'help.requests_sub': 'Consulter les litiges actifs et tickets',

    // Legal
    'legal.title': 'Mentions Légales',
    'legal.subtitle': 'Conditions d\'utilisation et politiques de confidentialité',
    'legal.terms': 'Conditions Générales d\'Utilisation',
    'legal.terms_sub': 'Conditions de la plateforme, accord séquestre et garanties',
    'legal.privacy': 'Politique de Confidentialité',
    'legal.privacy_sub': 'Traitement des données conforme NDPR',

    // Account Actions
    'actions.title': 'Actions du Compte',
    'actions.subtitle': 'Se déconnecter ou fermer définitivement le compte',
    'actions.logout': 'Se Déconnecter',
    'actions.delete': 'Supprimer le compte',

    // Modals & Common Controls
    'modal.select_language': 'Choisir la langue',
    'modal.choose_language': 'Choisissez votre langue préférée pour l\'application.',
    'modal.save_changes': 'Enregistrer',
    'modal.cancel': 'Annuler',
    'modal.update_password': 'Mettre à jour le mot de passe',
    'modal.current_password': 'Mot de passe actuel',
    'modal.new_password': 'Nouveau mot de passe',
    'modal.confirm_password': 'Confirmer le mot de passe',

    // Customer Dashboard / Explore
    'explore.hero_title': 'Trouvez des Artisans Vérifiés Près de Chez Vous',
    'explore.hero_sub': 'Réservez des électriciens, plombiers, menuisiers certifiés avec garantie séquestre.',
    'explore.search_placeholder': 'Rechercher un électricien, plombier, menuisier...',
    'explore.all_categories': 'Toutes les catégories',
    'explore.book_now': 'Réserver',
    'explore.request_quote': 'Demander un devis',
    'explore.active_jobs': 'Missions Actives',
    'explore.all_jobs': 'Toutes les missions',
    'explore.awaiting_completion': 'En attente de validation',
    'explore.completed': 'Terminées',
    'explore.issue_reported': 'Problème Signalé',
    'explore.closed': 'Clôturées',
    'explore.rate_review': 'Évaluer & Commenter',
    'explore.confirm_completion': 'Confirmer la fin des travaux',
    'explore.cancel_booking': 'Annuler la réservation',
    'explore.chat': 'Discuter avec l\'artisan',
  }
};

export function t(key: string, lang: Language): string {
  const langObj = TRANSLATIONS[lang] || TRANSLATIONS['English (Nigeria)'];
  return langObj[key] || TRANSLATIONS['English (Nigeria)'][key] || key;
}
