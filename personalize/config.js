export const siteConfig = {
  // Site information
  name: "Xiaoquan's Notes",
  description: "Personal notes and documentation",
  
  // Social media configuration
  socials: {
    show: true, // Toggle to show/hide all social links
    email: "xiaoquan0622@gmail.com", // Special handling for email
    links: [
    // supported icons: Github, Linkedin, Mail, Twitter, Globe, FileText, Rss, Check, Copy,
    // Facebook, Instagram, Youtube, Twitch, Dribbble, Figma 
    // or you can go to components/social-links.tsx to add more icons
    // default icon will be Globe


      {
        name: "LinkedIn",
        url: "https://www.linkedin.com/in/xiaoquan-zhao-b21a1633b/",
        // Icon will be automatically determined if in the supported list
      },
      {
        name: "GitHub",
        url: "https://github.com/Xiaoquan006Zhao/",
        // Icon will be automatically determined if in the supported list
      },
      // Add more social links as needed
    //   {
    //     name: "Custom", 
    //     url: "https://example.com",
    //     icon: "globe" // Optional custom icon name if auto-detection won't work
    //   }
    ]
  },
  
}