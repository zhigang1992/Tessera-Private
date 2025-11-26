import anthropic from '@/assets/anthropic.png'
import gemini from '@/assets/gemini.png'
import openAi from '@/assets/open-ai.png'
import spacex from '@/assets/spacex.png'

export default function HeroSection() {
  const partners = [
    {
      img: spacex,
      href: 'https://www.spacex.com/',
    },
    {
      img: openAi,
      href: 'https://openai.com/',
    },

    {
      img: anthropic,
      href: 'https://www.anthropic.com/',
    },
    {
      img: gemini,
      href: 'https://gemini.com/',
    },
  ]

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-black dark:text-white">
        <h1 className="text-[54px] font-semibold leading-[1.05] tracking-tight sm:text-[60px]">The first non-KYC</h1>
        <p className="text-[54px] font-semibold leading-[1.05] tracking-tight sm:text-[60px]">private equity token</p>
        <p className="text-[20px] leading-[1.05] font-semibold mt-4">
          Tessera tokens provide 1:1 economic exposure to private equity without the barriers
        </p>
      </div>

      <div className='flex items-center'>
        {partners.map((partner, index) => (
          <a
            key={index}
            href={partner.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <img className='h-12' src={partner.img} alt={`Partner ${index + 1}`} />
          </a>
        ))}
      </div>


      <div className="flex flex-col gap-3 text-[#4B5563] dark:text-[#D1D5DB] sm:flex-row sm:items-center sm:gap-8">
        <p className="text-sm leading-relaxed">
          Join our social channels <br className="hidden sm:block" />
          for the latest updates.
        </p>

        <div className="flex items-center gap-3">
          <a
            href="https://google.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Join Tessera on Discord"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#D2FB95] text-black transition-transform duration-200 hover:-translate-y-0.5 hover:opacity-90"
          >
            <svg width="20" height="20" viewBox="0 0 19 19" fill="currentColor">
              <path d="M15.9 3.12A15.68 15.68 0 0 0 12.03 2a.06.06 0 0 0-.06.03c-.17.3-.36.69-.49.99a14.47 14.47 0 0 0-4.34 0 10.09 10.09 0 0 0-.5-.99.06.06 0 0 0-.06-.03c-1.36.23-2.66.64-3.87 1.12a.05.05 0 0 0-.03.02C.37 6.73-.22 10.24.07 13.7a.07.07 0 0 0 .03.04 15.79 15.79 0 0 0 4.75 2.4.06.06 0 0 0 .07-.02c.37-.5.7-1.03.98-1.59a.06.06 0 0 0-.03-.08 10.41 10.41 0 0 1-1.48-.71.06.06 0 0 1 0-.1c.1-.07.2-.15.29-.23a.06.06 0 0 1 .06 0c3.1 1.42 6.46 1.42 9.52 0a.06.06 0 0 1 .06 0c.1.08.2.16.3.23a.06.06 0 0 1 0 .1c-.47.28-.97.51-1.48.7a.06.06 0 0 0-.03.09c.29.56.62 1.09.98 1.59a.06.06 0 0 0 .07.02 15.73 15.73 0 0 0 4.76-2.4.06.06 0 0 0 .03-.04c.34-4.01-.57-7.5-2.42-10.59a.05.05 0 0 0-.02-.02zM6.35 11.71c-.81 0-1.47-.74-1.47-1.65s.65-1.65 1.47-1.65c.82 0 1.48.75 1.47 1.65 0 .91-.65 1.65-1.47 1.65zm6.31 0c-.81 0-1.47-.74-1.47-1.65s.65-1.65 1.47-1.65c.82 0 1.48.75 1.47 1.65 0 .91-.65 1.65-1.47 1.65z" />
            </svg>
          </a>

          <a
            href="https://x.com/tessera_pe"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow Tessera on X"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#D2FB95] text-black transition-transform duration-200 hover:-translate-y-0.5 hover:opacity-90"
          >
            <svg width="18" height="17" viewBox="0 0 21 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M17.5739 0L11.6749 6.71331L6.96349 0H0.132941L7.8777 11.0353L0 20H2.9381L9.18215 12.8939L14.1695 20H21L12.9796 8.57219L20.5118 0H17.5739ZM15.4593 17.8844L10.5532 11.0141L9.71346 9.83769L4.23962 2.17192H5.65923L10.3573 8.75137L11.111 9.80694L16.8789 17.8844H15.4593ZM10.0768 11.1605L3.32526 1.70549L9.32304 10.1049L10.0768 11.1605Z"
              />
            </svg>
          </a>

          <a
            href="https://t.me/TesseraLabs"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Join Tessera on Telegram"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#D2FB95] text-black transition-transform duration-200 hover:-translate-y-0.5 hover:opacity-90"
          >
            <svg width="20" height="20" viewBox="0 0 22 22" fill="currentColor">
              <path d="M19.24 2.76l-17.5 6.76c-1.19.48-1.18 1.14-.22 1.44l4.5 1.4 10.42-6.57c.49-.3.94-.14.57.19l-8.44 7.62-.32 4.77c.47 0 .68-.21.94-.46l2.27-2.2 4.7 3.47c.87.48 1.49.23 1.71-.81l3.09-14.56c.32-1.28-.49-1.86-1.32-1.48z" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}
