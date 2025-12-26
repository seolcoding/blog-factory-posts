export const SITE = {
  website: "https://seolcoding.github.io/blog-factory-posts/", // Blog Factory GitHub Pages
  author: "Blog Factory",
  profile: "https://github.com/seolcoding",
  desc: "AI, 개발, 트렌드 - 바이럴 콘텐츠 자동화 블로그",
  title: "Blog Factory",
  ogImage: "og-image.jpg",
  lightAndDarkMode: true,
  postPerIndex: 6,
  postPerPage: 8,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: true,
  showBackButton: true, // show back button in post detail
  editPost: {
    enabled: false,
    text: "Edit",
    url: "https://github.com/seolcoding/blog-factory-posts/edit/main/",
  },
  dynamicOgImage: true,
  dir: "ltr",
  lang: "ko", // 한국어 블로그
  timezone: "Asia/Seoul", // 한국 시간대
} as const;
