export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-6 z-10">
      <div className="container mx-auto px-4 text-center">
        <p>&copy; 2025 AffiliTap. All rights reserved.</p>
        <p className="mt-2 text-gray-400">
          Disclaimer: This extension is not endorsed by, directly affiliated with, maintained, authorized, or sponsored by Facebook™ or Amazon™. The use of the Facebook™ or Amazon™ trade name or trademark is for identification, reference or descriptive purposes only and does not imply any association with Facebook™ or Amazon™ or their product brand.
        </p>
        <p className="mt-4">
          Visit us at{" "}
          <a
            href="https://affilitap.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-500 underline"
          >
            affilitap.vercel.app
          </a>
        </p>
      </div>
    </footer>
  );
}
