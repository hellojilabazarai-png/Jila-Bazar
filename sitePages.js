// About Us / Terms / Privacy / Reseller Terms ka text teeno bhasha (hi / en / bn) mein.
// Admin Panel > Site Pages se har bhasha ka text alag se badla ja sakta hai.

export const SITE_PAGE_KEYS = ["about", "terms", "privacy", "resellerTerms"];

export const DEFAULT_SITE_PAGES = {
    about: {
        hi: `जिला बाजार — आपका अपना हाइपरलोकल बाज़ार। हम स्थानीय विक्रेताओं को सीधे ग्राहकों से जोड़ते हैं, ताकि आपको अपने शहर/ज़िले की अच्छी चीज़ें आसानी से मिलें।

अकाउंट सुरक्षा: जब मोबाइल OTP सुविधा चालू होगी, तब रजिस्टर करते समय दिए गए मोबाइल नंबर को OTP से सत्यापित करना होगा। 2FA (Google Authenticator) वैकल्पिक है — जब चाहें प्रोफ़ाइल > सिक्योरिटी सेटिंग्स से चालू/बंद कर सकते हैं।`,
        en: `Jila Bazar — your very own hyperlocal bazaar. We connect local sellers directly with customers, so you can easily find the best things from your own town/district.

Account Security: Once the mobile OTP feature is turned on, the mobile number you give while registering will need to be verified with an OTP. 2FA (Google Authenticator) is optional — you can turn it on or off any time from Profile > Security Settings.`,
        bn: `জিলা বাজার — আপনার নিজের হাইপারলোকাল বাজার। আমরা স্থানীয় বিক্রেতাদের সরাসরি ক্রেতাদের সঙ্গে যুক্ত করি, যাতে আপনি নিজের শহর/জেলার ভালো জিনিস সহজেই পান।

অ্যাকাউন্ট সুরক্ষা: মোবাইল OTP সুবিধা চালু হলে রেজিস্টার করার সময় দেওয়া মোবাইল নম্বর OTP দিয়ে যাচাই করতে হবে। 2FA (Google Authenticator) ঐচ্ছিক — যখন খুশি প্রোফাইল > সিকিউরিটি সেটিংস থেকে চালু/বন্ধ করতে পারেন।`,
    },

    terms: {
        hi: `जिला बाजार — नियम एवं शर्तें (Terms & Conditions)

1. सामान्य
जिला बाजार ("हम", "प्लेटफ़ॉर्म") एक हाइपरलोकल मार्केटप्लेस ऐप है जो स्थानीय विक्रेताओं को ग्राहकों से जोड़ता है। ऐप इस्तेमाल करके आप इन शर्तों से सहमत होते हैं।

2. अकाउंट
- आपको सही जानकारी (नाम, मोबाइल/ईमेल) देनी होगी।
- आपका पासवर्ड/अकाउंट गोपनीय है, इसे किसी और के साथ साझा न करें।
- गलत जानकारी या धोखाधड़ी पाए जाने पर अकाउंट ब्लॉक किया जा सकता है।

3. ऑर्डर और पेमेंट
- ऑर्डर कन्फ़र्म होने के बाद विक्रेता उसे प्रोसेस करेगा।
- कैश ऑन डिलीवरी (COD) और ऑनलाइन पेमेंट (जब चालू हो) उपलब्ध हैं।
- कीमत और उपलब्धता बदल सकती है, ऑर्डर कन्फ़र्म होने तक अंतिम नहीं मानी जाएगी।

4. कैंसिलेशन पॉलिसी
- ऑर्डर 'processing' स्थिति में हो तो ग्राहक उसे कैंसिल कर सकता है।
- एक बार 'shipped'/'out for delivery' हो जाने के बाद कैंसिलेशन संभव नहीं होगा — डिलीवरी के बाद केवल रिटर्न/रिफ़ंड प्रक्रिया इस्तेमाल करें।
- विक्रेता भी उचित कारण (स्टॉक न होना, पते की समस्या) पर ऑर्डर कैंसिल कर सकता है।

5. रिटर्न और रिफ़ंड पॉलिसी
- खराब/गलत प्रोडक्ट मिलने पर डिलीवरी के 24-48 घंटे के अंदर रिटर्न रिक्वेस्ट करें।
- रिटर्न मंज़ूर होने के बाद रिफ़ंड COD के लिए बैंक ट्रांसफ़र से और ऑनलाइन पेमेंट के लिए मूल पेमेंट तरीके में 5-7 कार्यदिवस में प्रोसेस होगा।
- कुछ श्रेणियाँ (जल्दी खराब होने वाली/खाने की चीज़ें, जहाँ लागू हो) रिटर्न के योग्य नहीं हो सकतीं।

6. शिपिंग और डिलीवरी
- डिलीवरी का समय विक्रेता/लोकेशन के हिसाब से अलग हो सकता है, ऐप में अनुमान दिखाया जाता है।
- डिलीवरी चार्ज ऑर्डर की कीमत के हिसाब से लगता है (कम ऑर्डर पर लग सकता है, बड़े ऑर्डर पर फ़्री हो सकता है — ऐप में मौजूदा दरें दिखती हैं)।
- देरी की स्थिति में हम ऐप में ऑर्डर की स्थिति अपडेट करते रहेंगे।

7. विक्रेता की ज़िम्मेदारियाँ
- प्रोडक्ट की गुणवत्ता, सही जानकारी, और समय पर पैकिंग/हैंडओवर विक्रेता की ज़िम्मेदारी है।
- नकली/प्रतिबंधित सामान लिस्ट नहीं किया जा सकता।
- कमीशन हर बिक्री पर प्लेटफ़ॉर्म की नीति के अनुसार कटेगा।

8. रीसेलर
- रीसेलर से जुड़ी शर्तें अलग से "Reseller Agreement" सेक्शन में दी गई हैं।

9. ज़िम्मेदारी की सीमा
- जिला बाजार एक मार्केटप्लेस है — प्रोडक्ट की गुणवत्ता/डिलीवरी की अंतिम ज़िम्मेदारी विक्रेता की होती है। हम विवाद सुलझाने में मदद करते हैं लेकिन गारंटी नहीं दे सकते।

10. बदलाव
- ये शर्तें समय-समय पर अपडेट हो सकती हैं, बड़े बदलाव ऐप में सूचित किए जाएँगे।

(यह एक शुरुआती टेम्पलेट है — असली बिज़नेस लॉन्च से पहले इसे किसी वकील से जँचवाना ज़रूरी है, ख़ासकर पेमेंट/रिफ़ंड वाली धाराओं के लिए।)`,
        en: `Jila Bazar — Terms & Conditions

1. General
Jila Bazar ("we", "the platform") is a hyperlocal marketplace app that connects local sellers with customers. By using the app, you agree to these terms.

2. Account
- You must provide correct information (name, mobile/email).
- Your password/account is confidential. Do not share it with anyone.
- Your account may be blocked if wrong information or fraud is found.

3. Orders and Payment
- After an order is confirmed, the seller will process it.
- Cash on Delivery (COD) and online payment (when enabled) are available.
- Prices and availability can change and are not final until the order is confirmed.

4. Cancellation Policy
- A customer can cancel an order while it is in 'processing' status.
- Once an order is 'shipped' or 'out for delivery', cancellation is not possible — after delivery, please use the Return/Refund process only.
- A seller can also cancel an order for a valid reason (out of stock, address issue).

5. Return & Refund Policy
- If you receive a damaged or wrong product, raise a return request within 24-48 hours of delivery.
- Once a return is approved, the refund is processed within 5-7 working days — by bank transfer for COD orders and to the original payment method for online payments.
- Some categories (perishable/food items, where applicable) may not be eligible for return.

6. Shipping & Delivery
- Delivery time can vary by seller/location. An estimate is shown in the app.
- Delivery charges depend on the order value (they may apply on small orders and may be free on larger orders — current rates are shown in the app).
- In case of delay, we will keep updating the order status in the app.

7. Seller Responsibilities
- Product quality, correct information, and timely packing/handover are the seller's responsibility.
- Fake or prohibited items cannot be listed.
- Commission is deducted on every sale as per the platform's policy.

8. Reseller
- Reseller-specific terms are given separately in the "Reseller Agreement" section.

9. Limitation of Liability
- Jila Bazar is a marketplace — the final responsibility for product quality and delivery lies with the seller. We help resolve disputes but cannot give a guarantee.

10. Changes
- These terms may be updated from time to time. Major changes will be notified in the app.

(This is a starting template — it is strongly recommended to have a lawyer review it before the actual business launch, especially the payment/refund clauses.)`,
        bn: `জিলা বাজার — শর্তাবলী (Terms & Conditions)

১. সাধারণ
জিলা বাজার ("আমরা", "প্ল্যাটফর্ম") একটি হাইপারলোকাল মার্কেটপ্লেস অ্যাপ, যা স্থানীয় বিক্রেতাদের ক্রেতাদের সঙ্গে যুক্ত করে। অ্যাপ ব্যবহার করে আপনি এই শর্তগুলিতে সম্মত হচ্ছেন।

২. অ্যাকাউন্ট
- আপনাকে সঠিক তথ্য (নাম, মোবাইল/ইমেইল) দিতে হবে।
- আপনার পাসওয়ার্ড/অ্যাকাউন্ট গোপনীয়, এটি অন্য কারও সঙ্গে শেয়ার করবেন না।
- ভুল তথ্য বা প্রতারণা ধরা পড়লে অ্যাকাউন্ট ব্লক করা হতে পারে।

৩. অর্ডার ও পেমেন্ট
- অর্ডার কনফার্ম হওয়ার পর বিক্রেতা সেটি প্রসেস করবেন।
- ক্যাশ অন ডেলিভারি (COD) এবং অনলাইন পেমেন্ট (চালু থাকলে) পাওয়া যায়।
- দাম ও প্রাপ্যতা বদলাতে পারে, অর্ডার কনফার্ম না হওয়া পর্যন্ত তা চূড়ান্ত বলে ধরা হবে না।

৪. বাতিলের নীতি (Cancellation Policy)
- অর্ডার 'processing' অবস্থায় থাকলে ক্রেতা সেটি বাতিল করতে পারেন।
- একবার 'shipped'/'out for delivery' হয়ে গেলে বাতিল করা যাবে না — ডেলিভারির পর শুধু রিটার্ন/রিফান্ড প্রক্রিয়া ব্যবহার করুন।
- বিক্রেতাও যথাযথ কারণে (স্টক না থাকা, ঠিকানার সমস্যা) অর্ডার বাতিল করতে পারেন।

৫. রিটার্ন ও রিফান্ড নীতি
- ক্ষতিগ্রস্ত/ভুল পণ্য পেলে ডেলিভারির ২৪-৪৮ ঘণ্টার মধ্যে রিটার্ন অনুরোধ করুন।
- রিটার্ন অনুমোদিত হলে রিফান্ড COD-এর ক্ষেত্রে ব্যাংক ট্রান্সফারে এবং অনলাইন পেমেন্টের ক্ষেত্রে আসল পেমেন্ট পদ্ধতিতে ৫-৭ কার্যদিবসের মধ্যে প্রসেস হবে।
- কিছু বিভাগ (পচনশীল/খাদ্যদ্রব্য, যেখানে প্রযোজ্য) রিটার্নের যোগ্য নাও হতে পারে।

৬. শিপিং ও ডেলিভারি
- ডেলিভারির সময় বিক্রেতা/স্থান অনুযায়ী আলাদা হতে পারে, অ্যাপে আনুমানিক সময় দেখানো হয়।
- ডেলিভারি চার্জ অর্ডারের মূল্য অনুযায়ী লাগে (কম অর্ডারে লাগতে পারে, বড় অর্ডারে ফ্রি হতে পারে — অ্যাপে বর্তমান হার দেখা যায়)।
- দেরি হলে আমরা অ্যাপে অর্ডারের অবস্থা আপডেট করতে থাকব।

৭. বিক্রেতার দায়িত্ব
- পণ্যের মান, সঠিক তথ্য এবং সময়মতো প্যাকিং/হস্তান্তর বিক্রেতার দায়িত্ব।
- নকল/নিষিদ্ধ পণ্য তালিকাভুক্ত করা যাবে না।
- প্ল্যাটফর্মের নীতি অনুযায়ী প্রতিটি বিক্রয়ে কমিশন কাটা হবে।

৮. রিসেলার
- রিসেলার সংক্রান্ত শর্ত আলাদাভাবে "Reseller Agreement" অংশে দেওয়া আছে।

৯. দায়বদ্ধতার সীমা
- জিলা বাজার একটি মার্কেটপ্লেস — পণ্যের মান/ডেলিভারির চূড়ান্ত দায়িত্ব বিক্রেতার। আমরা বিবাদ মেটাতে সাহায্য করি, কিন্তু গ্যারান্টি দিতে পারি না।

১০. পরিবর্তন
- এই শর্তগুলি সময়ে সময়ে হালনাগাদ হতে পারে, বড় পরিবর্তন অ্যাপে জানানো হবে।

(এটি একটি প্রাথমিক টেমপ্লেট — প্রকৃত ব্যবসা চালুর আগে, বিশেষ করে পেমেন্ট/রিফান্ড ধারাগুলি, একজন আইনজীবীকে দিয়ে দেখিয়ে নেওয়ার পরামর্শ দেওয়া হচ্ছে।)`,
    },

    privacy: {
        hi: `जिला बाजार — प्राइवेसी पॉलिसी

1. हम कौन सा डेटा इकट्ठा करते हैं
- अकाउंट जानकारी: नाम, मोबाइल नंबर, ईमेल (अगर दिया हो), पासवर्ड (हैश/सुरक्षित रूप में)
- ऑर्डर जानकारी: डिलीवरी का पता, ऑर्डर का इतिहास
- लोकेशन: सिर्फ़ तब जब आप खुद 'Location Add Karein' बटन दबाएँ या डिलीवरी का पता सेट करें — अपने आप/चुपके से कभी नहीं ली जाती
- पेमेंट जानकारी: हम खुद कार्ड/UPI की जानकारी स्टोर नहीं करते, पेमेंट गेटवे (जब चालू हो) उसे सुरक्षित तरीके से संभालेगा

2. डेटा का इस्तेमाल कैसे होता है
- ऑर्डर प्रोसेस करने, डिलीवरी कराने और ग्राहक सहायता के लिए
- आस-पास के प्रोडक्ट/विक्रेता दिखाने के लिए (अगर लोकेशन दी हो)
- अकाउंट सुरक्षा (जैसे 2FA) के लिए

3. डेटा किसके साथ साझा होता है
- ऑर्डर पूरा करने के लिए ज़रूरी जानकारी (नाम, पता, फ़ोन) संबंधित विक्रेता/डिलीवरी पार्टनर के साथ साझा होती है
- हम आपका डेटा किसी थर्ड-पार्टी को बेचते नहीं हैं

4. डेटा सुरक्षा
- पासवर्ड हैश रूप में स्टोर होता है, सादे टेक्स्ट में कभी नहीं
- संवेदनशील एडमिन/वित्तीय कार्य 2FA से सुरक्षित हैं

5. आपके अधिकार
- आप अपना डेटा प्रोफ़ाइल से देख/अपडेट कर सकते हैं
- अकाउंट डिलीट/डेटा हटवाने के लिए सपोर्ट (WhatsApp) पर संपर्क करें

6. कुकीज़/स्टोरेज
- ऐप आपके डिवाइस पर सिर्फ़ ज़रूरी सेशन जानकारी (जैसे लॉगिन सेशन) स्टोर करता है, ट्रैकिंग कुकीज़ नहीं।

7. संपर्क
- प्राइवेसी से जुड़े किसी भी सवाल के लिए हमारे बारे में पेज के WhatsApp सपोर्ट लिंक से संपर्क करें।

(यह भी एक शुरुआती टेम्पलेट है — प्रोडक्शन लॉन्च से पहले वकील से जँचवाना ज़रूरी है।)`,
        en: `Jila Bazar — Privacy Policy

1. What data we collect
- Account info: name, mobile number, email (if provided), password (in hashed/secure form)
- Order info: delivery address, order history
- Location: only when you yourself tap the 'Add Location' button or set a delivery address — it is never taken automatically or silently
- Payment info: we do not store card/UPI details ourselves; the payment gateway (when enabled) will handle them securely

2. How the data is used
- To process orders, arrange delivery, and provide customer support
- To show nearby products/sellers (if you have given a location)
- For account security (such as 2FA)

3. Who the data is shared with
- The information needed to fulfil an order (name, address, phone) is shared with the concerned seller/delivery partner
- We do not sell your data to any third party

4. Data Security
- Passwords are stored in hashed form, never in plain text
- Sensitive admin/financial actions are protected by 2FA

5. Your Rights
- You can view/update your data from Profile
- To delete your account or remove your data, contact Support (WhatsApp)

6. Cookies/Storage
- The app stores only the necessary session information on your device (such as the login session), not tracking cookies.

7. Contact
- For any privacy-related question, contact us through the WhatsApp Support link on the About Us page.

(This is also a starting template — a lawyer review is recommended before production launch.)`,
        bn: `জিলা বাজার — গোপনীয়তা নীতি (Privacy Policy)

১. আমরা কী কী তথ্য সংগ্রহ করি
- অ্যাকাউন্টের তথ্য: নাম, মোবাইল নম্বর, ইমেইল (দিলে), পাসওয়ার্ড (হ্যাশ/সুরক্ষিত আকারে)
- অর্ডারের তথ্য: ডেলিভারির ঠিকানা, অর্ডারের ইতিহাস
- লোকেশন: শুধু তখনই, যখন আপনি নিজে 'লোকেশন যোগ করুন' বোতাম চাপেন বা ডেলিভারির ঠিকানা সেট করেন — নিজে থেকে/গোপনে কখনও নেওয়া হয় না
- পেমেন্টের তথ্য: আমরা নিজে কার্ড/UPI-এর তথ্য সংরক্ষণ করি না, পেমেন্ট গেটওয়ে (চালু হলে) তা নিরাপদে সামলাবে

২. তথ্য কীভাবে ব্যবহার হয়
- অর্ডার প্রসেস, ডেলিভারি এবং গ্রাহক সহায়তার জন্য
- কাছাকাছি পণ্য/বিক্রেতা দেখাতে (লোকেশন দিলে)
- অ্যাকাউন্ট সুরক্ষার (যেমন 2FA) জন্য

৩. তথ্য কার সঙ্গে শেয়ার হয়
- অর্ডার সম্পূর্ণ করতে প্রয়োজনীয় তথ্য (নাম, ঠিকানা, ফোন) সংশ্লিষ্ট বিক্রেতা/ডেলিভারি পার্টনারের সঙ্গে শেয়ার করা হয়
- আমরা আপনার তথ্য কোনও তৃতীয় পক্ষের কাছে বিক্রি করি না

৪. তথ্যের নিরাপত্তা
- পাসওয়ার্ড হ্যাশ আকারে সংরক্ষিত হয়, সাধারণ টেক্সটে কখনও নয়
- সংবেদনশীল অ্যাডমিন/আর্থিক কাজ 2FA দিয়ে সুরক্ষিত

৫. আপনার অধিকার
- আপনি প্রোফাইল থেকে নিজের তথ্য দেখতে/হালনাগাদ করতে পারেন
- অ্যাকাউন্ট ডিলিট/তথ্য মুছতে সাপোর্টে (WhatsApp) যোগাযোগ করুন

৬. কুকিজ/স্টোরেজ
- অ্যাপ আপনার ডিভাইসে শুধু প্রয়োজনীয় সেশন তথ্য (যেমন লগইন সেশন) সংরক্ষণ করে, ট্র্যাকিং কুকিজ নয়।

৭. যোগাযোগ
- গোপনীয়তা সংক্রান্ত যেকোনো প্রশ্নে আমাদের সম্পর্কে পেজের WhatsApp সাপোর্ট লিঙ্কে যোগাযোগ করুন।

(এটিও একটি প্রাথমিক টেমপ্লেট — প্রোডাকশন চালুর আগে একজন আইনজীবীকে দিয়ে দেখিয়ে নেওয়ার পরামর্শ দেওয়া হচ্ছে।)`,
    },

    resellerTerms: {
        hi: `1. रीसेलर अपनी कीमत खुद तय कर सकता है, जो मूल कीमत से कम नहीं हो सकती।
2. रीसेलर को सिर्फ़ मार्जिन (अपनी कीमत - मूल कीमत) मिलता है, प्रोडक्ट का पूरा पैसा नहीं।
3. प्रोडक्ट की गुणवत्ता, डिलीवरी और रिटर्न की ज़िम्मेदारी असली विक्रेता की होती है, रीसेलर की नहीं।
4. गलत जानकारी या धोखाधड़ी पाए जाने पर रीसेलर अकाउंट तुरंत बंद किया जा सकता है।
5. KYC (PAN/आधार) जमा करना और एडमिन की मंज़ूरी ज़रूरी है।`,
        en: `1. A reseller can set their own price, which cannot be lower than the original price.
2. A reseller gets only the margin (own price - original price), not the full amount of the product.
3. Responsibility for product quality, delivery and returns lies with the original seller, not the reseller.
4. If wrong information or fraud is found, the reseller account can be closed immediately.
5. Submitting KYC (PAN/Aadhaar) and Admin approval are required.`,
        bn: `১. রিসেলার নিজের দাম নিজে ঠিক করতে পারেন, যা আসল দামের চেয়ে কম হতে পারবে না।
২. রিসেলার শুধু মার্জিন (নিজের দাম - আসল দাম) পান, পণ্যের পুরো টাকা নয়।
৩. পণ্যের মান, ডেলিভারি ও রিটার্নের দায়িত্ব আসল বিক্রেতার, রিসেলারের নয়।
৪. ভুল তথ্য বা প্রতারণা ধরা পড়লে রিসেলার অ্যাকাউন্ট তৎক্ষণাৎ বন্ধ করা যেতে পারে।
৫. KYC (PAN/আধার) জমা দেওয়া এবং অ্যাডমিনের অনুমোদন প্রয়োজন।`,
    },
};

// Purani (Hinglish) default text ki pehchaan — agar database mein wahi purana default save hai
// to usse naye 3-bhasha default se badal diya jaata hai. Admin ne apna text likha ho to wo nahi chhedta.
const LEGACY_DEFAULT_STARTS = {
    about: "जिला बाजार — aapka apna hyperlocal bazar",
    terms: "जिला बाजार — नियम एवं शर्तें (Terms & Conditions)\n\n1. सामान्य\nजिला बाजार (",
    privacy: "जिला बाजार — Privacy Policy\n\n1. Hum kya data",
    resellerTerms: "1. Reseller apna khud ka price set kar sakta hai",
};
const isLegacyDefault = (page, str) => !!LEGACY_DEFAULT_STARTS[page] && String(str).startsWith(LEGACY_DEFAULT_STARTS[page]);

const LANGS = ["hi", "en", "bn"];

// Ek page ka text teeno bhasha mein ({hi, en, bn}) — Admin editor aur display dono isi se chalte hain.
export function getSitePageAllLangs(db, page) {
    const defaults = DEFAULT_SITE_PAGES[page] || { hi: "", en: "", bn: "" };
    const stored = db && db.sitePages ? db.sitePages[page] : undefined;
    const out = {};
    for (const l of LANGS) {
        if (stored && typeof stored === "object") out[l] = stored[l] || defaults[l] || "";
        else if (typeof stored === "string" && stored.trim() && !isLegacyDefault(page, stored)) out[l] = stored; // Admin ne khud likha single text — sab bhasha mein wahi dikhega
        else out[l] = defaults[l] || "";
    }
    return out;
}

export function getSitePageText(db, page, lang) {
    const all = getSitePageAllLangs(db, page);
    return all[lang] || all.hi || "";
}
