export interface NavLink {
  title: string;
  url: string;
}

export const mainNavigation: NavLink[] = [
  { title: "Publications", url: "/publications/" },
  { title: "Memos", url: "/insights/" },
  { title: "Internships", url: "/#experience" },
  { title: "CV", url: "/cv/" },
];
