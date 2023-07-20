import { hopeTheme } from "vuepress-theme-hope";
//中文导航栏
import { zhNavbar } from "./navbar/index.js";
//中文侧边栏
import { zhSidebar } from "./sidebar/index.js";

export default hopeTheme({
  //当前网站部署到gitee
  hostname: "https://gitee.com/zhaoxi7109",

  author: {
    name: "zhaoxi",
    url: "https://gitee.com/zhaoxi7109",
  },

  iconAssets: "fontawesome-with-brands",

  logo: "/logo.png",

  repo: "https://gitee.com/zhaoxi7109",


  footer: "默认页脚",

  displayFooter: true,

  // 自定义仓库链接文字-默认从repo中自动推断为"GitHub" / "GitLab" / "Gitee" / "Bitbucket" 其中之一，或是 "Source"。
  repoLabel: "Gitee",

  // 是否在导航栏内显示仓库链接-默认为true
  repoDisplay: true,

  //加密
  // encrypt: {
  //   config: {
  //     "/demo/encrypt.html": ["1234"],
  //   },
  // },

  // page meta
  metaLocales: {
    editLink: "在 Gitee 上编辑此页",
  },

    // 导航栏布局
  navbarLayout: {
    start: ["Brand"],
    center: ["Links"],
    end: ["Language", "Repo", "Outlook", "Search"],
  },

   // 页面显示信息
  pageInfo: ["Category", "Tag", "ReadingTime"],
  
  // 路径导航
  breadcrumb: true,

  // 路径导航的图标显示
  breadcrumbIcon: true,

  // 暗黑模式切换-在深色模式和浅色模式中切换
  darkmode: "toggle",
  // 全屏按钮
  fullscreen: true,
  // 返回顶部按钮-下滑300px后显示
  backToTop: true,
  // 纯净模式-禁用
  pure: false,

  // 文章的最后更新时间
  lastUpdated: true,

  // 显示页面的贡献者
  contributors: false,

  // 文章所在仓库
  docsRepo: "https://gitee.com/zhaoxi7109/mynotes.git",

  // 文章所在分支
  docsBranch: "master",

  // 文章所在目录
  docsDir: "src",

  // 多语言设置
  locales: {
    "/": {
      // 导航栏
      navbar: zhNavbar,

      // 侧边栏
      sidebar: zhSidebar,

      // 全局设置页脚信息
      footer: "昭晞的小破站",

      // 显示页脚
      displayFooter: false,

      // 页面配置信息
      metaLocales: {
        editLink: "在【Gitee】上编辑此页",
      },
    },
  },
  // 博客配置
  blog: {
    // 头像
    avatar: "/blog-logo.png",
    // 名称
    name: "zhaoxi",
    // 是否是圆形头像
    roundAvatar: true,
    // 个人描述
    description: "时不我待，力争朝夕",
    // 社交媒体
    medias: {
      Gitee: "https://gitee.com/zhaoxi7109",
      GitHub: "https://github.com/zhaoxi7109",
      QQ:"2997605126",
      Qzone:"https://user.qzone.qq.com/2997605126/",
      BiliBili:"https://space.bilibili.com/1806649688",
      Email:"2997605126@qq.com",
      Gmail:"gadephog@gmail.com",
      Wechat:"",
    },
    // 博客的侧边栏设置
    sidebarDisplay: "mobile",
    // 每页展示的文章数量
    articlePerPage: 7,
    timeline: "zhaoxi的时光轴",
  },

  plugins: {
    // 在MD文件中启用的组件
    // components : [
    // // 为站点提供了在MD文档中自定义颜色的徽章
    //   "Badge",
    //   // 为站点提供了在MD文档中加载B站视频的功能，但是不建议使用
    //   "BiliBili",
    //   // 为站点提供了在MD文档中加载PDF阅读器的功能，但是不建议使用
    //   // 原因一：PDF书籍较大，上传到码云后会大量占用码云空间
    //   // 原因二：当PDF阅读器较多的时候，将MD文档渲染成HTML页面比较耗费性能，使页面加载速度变慢
    //   "PDF",
    //   ],
    // 代码复制功能-vuepress-plugin-copy-code2
    copyCode : {
      // 在移动端也可以实现复制代码
      showInMobile: true,
      // 代码复制成功提示消息的时间-ms
      duration: 3000,
      // 纯净模式
      // pure: true,
    },
    // You should generate and use your own comment service
    comment: {
      provider: "Giscus",
      repo: "vuepress-theme-hope/giscus-discussions",
      repoId: "R_kgDOG_Pt2A",
      category: "Announcements",
      categoryId: "DIC_kwDOG_Pt2M4COD69",
    },

    // All features are enabled for demo, only preserve features you need here
    mdEnhance: {
      align: true,
      attrs: true,
      chart: true,
      codetabs: true,
      demo: true,
      echarts: true,
      figure: true,
      flowchart: true,
      gfm: true,
      imgLazyload: true,
      imgSize: true,
      include: true,
      katex: true,
      mark: true,
      mermaid: true,
      playground: {
        presets: ["ts", "vue"],
      },
      presentation: ["highlight", "math", "search", "notes", "zoom"],
      stylize: [
        {
          matcher: "Recommended",
          replacer: ({ tag }) => {
            if (tag === "em")
              return {
                tag: "Badge",
                attrs: { type: "tip" },
                content: "Recommended",
              };
          },
        },
      ],
      sub: true,
      sup: true,
      tabs: true,
      //vPre: true,
      vuePlayground: true,
    },
    // 打开博客功能
    blog: {
      // 在文章列表页面自动提取文章的摘要进行显示
      hotReload: true,
    },
    // 开启git实现编辑此页面-最后更新时间-贡献者功能
    git: true,
    // 关闭sitemap插件
    sitemap: false,
  },
});
