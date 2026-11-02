/**
 * Copy and screen order for /buyer-app. Screen markup lives in ./screens/*.html
 * (sample content only: Willow Creek Goldens, Maple, Jamie Rivera).
 */
export interface BuyerAppScreen {
  /** File name in ./screens without extension */
  id: string;
  /** Short Title Case label */
  label: string;
  /** One sentence, sentence case */
  text: string;
}

export interface BuyerAppSection {
  id: string;
  title: string;
  /** What the breeder gets (sentence case prose) */
  benefit: string;
  /** The same moment from the buyer's side */
  buyerVoice: string;
  screens: BuyerAppScreen[];
}

export const sections: BuyerAppSection[] = [
  {
    id: 'invite',
    title: 'One Tap From Your Invite',
    benefit:
      'You invite a buyer from BreederHQ, and they sign in with the email you used. They land in your buyer portal on their phone, with no further setup needed.',
    buyerVoice: '“I opened the app, chose ‘Invited by a Breeder,’ and everything from my breeder was already there.”',
    screens: [
      {
        id: 's1-1',
        label: 'Welcome',
        text: 'The first screen asks how they will use BreederHQ. Buyers choose “Invited by a Breeder” and sign in with the email on their invitation.',
      },
    ],
  },
  {
    id: 'home',
    title: 'Your Brand and Their Animal, Front and Center',
    benefit:
      "Your logo and cover image greet every buyer the moment they open the app. Their animal and photo are front and center along with a countdown to go-home day, and the newest photos you've shared. Whatever activities require the buyer's attention sit at the top, so it's clear what you're asking them to handle.",
    buyerVoice: '“I open the app and see my breeder’s name, my animal, and what I need to sign, without digging through email.”',
    screens: [
      {
        id: 's2-1',
        label: 'Buyer Home',
        text: 'Your logo, cover image, and location sit at the top of the screen. Needs Your Attention comes first, then the animal with a go-home countdown, then quiet rows for balance due, announcements, and your recommended products.',
      },
      {
        id: 's2-2',
        label: 'Switch Breeders',
        text: 'A buyer working with more than one breeder taps the program name to switch. The app remembers the last choice.',
      },
    ],
  },
  {
    id: 'animals',
    title: 'Watch Their Animal Grow Up',
    benefit:
      'The photos, health details, and milestones you share show up on the buyer’s phone as they happen. A buyer who is part of the rearing journey is a buyer who stays in touch.',
    buyerVoice: '“I love getting new photos for Maple from my breeder. Every new picture makes the wait a little easier.”',
    screens: [
      { id: 's3-1', label: 'Photos', text: 'Every photo you share for the animal, newest first.' },
      {
        id: 's3-2',
        label: 'Health',
        text: 'Vaccinations, deworming, and weight. Health details appear only when your plan includes sharing them with buyers.',
      },
      { id: 's3-3', label: 'Timeline', text: 'Birth, first vet check, the day they were picked, and more, in order.' },
    ],
  },
  {
    id: 'health',
    title: 'Health Records Their Vet Can Use',
    benefit:
      "Once buyers take home their animal, they will be able to easily download a Vet Report to hand to their animal's new vet. If you have a health guarantee and require proof, such as a vet exam in the first few days or spay/neuter, they can photograph or upload the vet's paperwork and it is saved to the animal’s record for your review.",
    buyerVoice: '“I took a picture of the vet’s paperwork, and the health guarantee requirement from my breeder showed as fulfilled.”',
    screens: [
      {
        id: 's4-1',
        label: 'Vet Report and Guarantee',
        text: 'A downloadable Vet Report, and each health guarantee requirement with its status.',
      },
      {
        id: 's4-2',
        label: 'Upload Proof',
        text: 'Take a photo or choose a file. Saving it marks the requirement fulfilled, and only the buyer and you can see it.',
      },
    ],
  },
  {
    id: 'draft',
    title: 'Selection Simplified - Pick Their Animal From Their Phone',
    benefit:
      'Running a Selection Draft? Buyers see when their turn is live, rank their favorites ahead of time, and make their pick without a phone call or a group text.',
    buyerVoice: '“I ranked my favorites the night before, so when my turn opened I knew exactly who I wanted.”',
    screens: [
      {
        id: 's5-1',
        label: 'Your Pick Is Live',
        text: 'When it is the buyer’s turn, a card leads Home with the time left to choose.',
      },
      {
        id: 's5-2',
        label: 'Before Their Turn',
        text: 'Buyers rank the animals in the order they would choose them, and see which are still available.',
      },
    ],
  },
  {
    id: 'pickup',
    title: 'Updates and Go-Home Day, Scheduled',
    benefit:
      'When you create Announcements, every buyer in that plan sees it in the app. When you open go-home time slots, your buyers can book an available slot in the app. The app always shows which slots are left.',
    buyerVoice: '“I booked 10:00 on go-home day and saw exactly what to bring.”',
    screens: [
      {
        id: 's6-1',
        label: 'Announcements',
        text: 'Your posts for the plan or program, with new ones marked.',
      },
      {
        id: 's6-2',
        label: 'Book Go-Home Time',
        text: 'Open slots, the address, and what to bring. If you set the time yourself, buyers see just the time.',
      },
    ],
  },
  {
    id: 'products',
    title: 'Your Recommended Products, One Tap Away',
    benefit:
      'Share the crate, the food, and the brush you trust, with your own note on each. Buyers see your list in the order you set it.',
    buyerVoice: '“I knew what to buy before my new animal came home, because my breeder had already listed it.”',
    screens: [
      {
        id: 's7-1',
        label: 'Products We Love',
        text: 'Your recommendations with your notes. A disclosure appears when the list includes affiliate links.',
      },
    ],
  },
  {
    id: 'messages',
    title: 'Keep the Conversation Going',
    benefit:
      'Buyers read and reply to your messages from the app, in the same threads you see on the web.',
    buyerVoice: '“I answered my breeder from the car and the plan for go-home day was settled.”',
    screens: [
      { id: 's8-1', label: 'Threads', text: 'All conversations with the breeder, with unread counts.' },
      {
        id: 's8-2',
        label: 'A Conversation',
        text: 'Buyers reply to a thread. New conversations still start from your side.',
      },
    ],
  },
  {
    id: 'pay',
    title: 'Invoices They Can Pay From the App',
    benefit:
      'Send an invoice and the buyer sees the amount and due date in the app. They pay through your secure checkout, and you are paid through your own Stripe account.',
    buyerVoice: '“I saw the balance, tapped Pay, and my receipt was waiting in Papers.”',
    screens: [
      { id: 's9-1', label: 'Invoice', text: 'The line items, the deposit already applied, and the amount due.' },
      {
        id: 's9-2',
        label: 'Confirming Payment',
        text: 'While a payment is confirmed, the app keeps the buyer on one clear screen.',
      },
      { id: 's9-3', label: 'Paid', text: 'Shown once the payment is confirmed. The receipt goes to Papers.' },
    ],
  },
  {
    id: 'sign',
    title: 'Agreements They Can Sign Anywhere',
    benefit:
      'Buyers read and sign your agreements on their phone, typed or drawn. If it is not their turn to sign yet, the app says who is up next instead of leaving them guessing.',
    buyerVoice: '“I read the agreement, typed my name, and signed from the couch.”',
    screens: [
      {
        id: 's10-1',
        label: 'Sign',
        text: 'Read the agreement, type or draw a signature, and confirm the electronic signature consent.',
      },
      {
        id: 's10-2',
        label: 'Waiting on the Breeder',
        text: 'When the breeder signs first, the buyer sees who the agreement is waiting on.',
      },
    ],
  },
  {
    id: 'documents',
    title: 'Every Document, Saved for Them',
    benefit:
      'Health certificates, receipts, and care guides live in Papers. Buyers open photos right in the app and send PDFs to the app they prefer, so nothing is buried in an old email.',
    buyerVoice: '“I found the health certificate in Papers when the vet asked for it.”',
    screens: [
      { id: 's11-1', label: 'Papers', text: 'Agreements and documents, each with its type, size, and date.' },
      {
        id: 's11-2',
        label: 'Share a File',
        text: 'PDFs open through the phone’s own share sheet, so buyers pick where to open or save them.',
      },
    ],
  },
];

export interface PhotoCredit {
  author: string;
  title: string;
  license: string;
  licenseUrl: string;
  fileUrl: string;
}

const commons = (file: string) => `https://commons.wikimedia.org/wiki/File:${file}`;

export const photoCredits: PhotoCredit[] = [
  {
    author: 'MichaelMcPhee',
    title: 'Callie the golden retriever puppy',
    license: 'CC BY 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/3.0',
    fileUrl: commons('Callie_the_golden_retriever_puppy.jpg'),
  },
  {
    author: 'Keagiles',
    title: '5-week-old Golden Retriever puppy',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    fileUrl: commons('5-week-old_Golden_Retriever_puppy.jpg'),
  },
  {
    author: 'Skipper112',
    title: '9 weeks old golden',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    fileUrl: commons('9_weeks_old_golden.JPG'),
  },
  {
    author: 'Davizosky',
    title: 'Cachorrito de Golden Retriever',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    fileUrl: commons('Cachorrito_de_Golden_Retriever.JPG'),
  },
  {
    author: 'Golden Lover',
    title: 'English Golden Retriever puppy',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    fileUrl: commons('English_Golden_Retriever_puppy.JPG'),
  },
  {
    author: 'Lucarelli',
    title: 'Golden Retriever - 7 weeks',
    license: 'Public domain',
    licenseUrl: '',
    fileUrl: commons('Golden_Retriever_-_7_weeks.jpg'),
  },
  {
    author: 'DannaCaterina245',
    title: '-babiesgolden',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    fileUrl: commons('-babiesgolden.JPG'),
  },
  {
    author: 'Chaoticfluffy',
    title: 'Greyhound in dog crate',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    fileUrl: commons('Greyhound_in_dog_crate.jpg'),
  },
  {
    author: 'James Redekop',
    title: 'Dog food in a bowl',
    license: 'CC BY-SA 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0',
    fileUrl: commons('Dog_food_in_a_bowl.jpg'),
  },
  {
    author: 'BLW',
    title: 'SoftHorseBrush',
    license: 'Public domain',
    licenseUrl: '',
    fileUrl: commons('SoftHorseBrush.jpg'),
  },
];
