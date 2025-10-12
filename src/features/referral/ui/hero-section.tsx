export default function HeroSection() {
  return (
    <div className="flex flex-col gap-10">
      {/* Tagline */}
      <div className="flex flex-col gap-4">
        <h1 className="text-[40px] leading-[1.21] font-bold text-black dark:text-white">
          Tessera
        </h1>
        <p className="text-[40px] leading-[1.21] font-bold text-black dark:text-white">
          A new form of trading
        </p>
      </div>

      {/* Social section */}
      <div className="flex items-center gap-4">
        <p className="text-sm text-black dark:text-white">
          Join our social channels<br />for the latest updates.
        </p>

        {/* Social icons */}
        <div className="flex items-center gap-2">
          {/* Discord */}
          <a
            href="https://google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-10 h-10 bg-[#D2FB95] dark:bg-[#D2FB95] rounded-full hover:opacity-80 transition-opacity"
          >
            <svg width="20" height="20" viewBox="0 0 19 19" fill="currentColor" className="text-black">
              <path d="M15.9 3.12A15.68 15.68 0 0 0 12.03 2a.06.06 0 0 0-.06.03c-.17.3-.36.69-.49.99a14.47 14.47 0 0 0-4.34 0 10.09 10.09 0 0 0-.5-.99.06.06 0 0 0-.06-.03c-1.36.23-2.66.64-3.87 1.12a.05.05 0 0 0-.03.02C.37 6.73-.22 10.24.07 13.7a.07.07 0 0 0 .03.04 15.79 15.79 0 0 0 4.75 2.4.06.06 0 0 0 .07-.02c.37-.5.7-1.03.98-1.59a.06.06 0 0 0-.03-.08 10.41 10.41 0 0 1-1.48-.71.06.06 0 0 1 0-.1c.1-.07.2-.15.29-.23a.06.06 0 0 1 .06 0c3.1 1.42 6.46 1.42 9.52 0a.06.06 0 0 1 .06 0c.1.08.2.16.3.23a.06.06 0 0 1 0 .1c-.47.28-.97.51-1.48.7a.06.06 0 0 0-.03.09c.29.56.62 1.09.98 1.59a.06.06 0 0 0 .07.02 15.73 15.73 0 0 0 4.76-2.4.06.06 0 0 0 .03-.04c.34-4.01-.57-7.5-2.42-10.59a.05.05 0 0 0-.02-.02zM6.35 11.71c-.81 0-1.47-.74-1.47-1.65s.65-1.65 1.47-1.65c.82 0 1.48.75 1.47 1.65 0 .91-.65 1.65-1.47 1.65zm6.31 0c-.81 0-1.47-.74-1.47-1.65s.65-1.65 1.47-1.65c.82 0 1.48.75 1.47 1.65 0 .91-.65 1.65-1.47 1.65z" />
            </svg>
          </a>

          {/* Twitter/X */}
          <a
            href="https://google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-10 h-10 bg-[#D2FB95] dark:bg-[#D2FB95] rounded-full hover:opacity-80 transition-opacity"
          >
            <svg width="18" height="15" viewBox="0 0 22 17" fill="currentColor" className="text-black">
              <path d="M21.46 2.01c-.77.34-1.6.57-2.46.67a4.3 4.3 0 0 0 1.88-2.37c-.83.5-1.75.85-2.72 1.05A4.28 4.28 0 0 0 10.88 5.3a12.14 12.14 0 0 1-8.8-4.47 4.28 4.28 0 0 0 1.32 5.71c-.7-.02-1.37-.22-1.95-.54v.05c0 2.07 1.47 3.8 3.42 4.19a4.3 4.3 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.97 8.59 8.59 0 0 1-5.31 1.83c-.35 0-.69-.02-1.02-.06a12.1 12.1 0 0 0 6.55 1.92c7.86 0 12.16-6.51 12.16-12.16 0-.19 0-.37-.01-.56A8.68 8.68 0 0 0 21.46 2.01z" />
            </svg>
          </a>

          {/* Telegram */}
          <a
            href="https://google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-10 h-10 bg-[#D2FB95] dark:bg-[#D2FB95] rounded-full hover:opacity-80 transition-opacity"
          >
            <svg width="20" height="20" viewBox="0 0 22 22" fill="currentColor" className="text-black">
              <path d="M19.24 2.76l-17.5 6.76c-1.19.48-1.18 1.14-.22 1.44l4.5 1.4 10.42-6.57c.49-.3.94-.14.57.19l-8.44 7.62-.32 4.77c.47 0 .68-.21.94-.46l2.27-2.2 4.7 3.47c.87.48 1.49.23 1.71-.81l3.09-14.56c.32-1.28-.49-1.86-1.32-1.48z" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
