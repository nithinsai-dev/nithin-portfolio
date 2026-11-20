export const EMAIL = 'ninsai2007@gmail.com'

export interface SocialLink {
  name: string
  url: string
}

export const contactContent = {
  label: '// contact',
  heading: "Let's build something that holds up.",
  subline:
    'Open to internships, collaborations and good conversations about building secure, intelligent software.',
  email: EMAIL,
  location: 'Coimbatore, IN',
  socialLinks: [
    { name: 'Resume', url: '/resume.pdf' },
    { name: 'GitHub', url: 'https://github.com/nithinsai-dev' },
    { name: 'LinkedIn', url: 'https://linkedin.com/in/nithin-sai07' },
    // { name: 'Codeforces', url: 'https://codeforces.com' },
  ] as SocialLink[],
  footer: {
    copyright: '© 2026 Nithin Sai',
    motto: 'Discipline over motivation.',
    backToTop: 'Back to top ↑',
  },
}

