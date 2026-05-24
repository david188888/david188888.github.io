export interface NavLink {
  title: string;
  url: string;
}

export const mainNavigation: NavLink[] = [
  { title: "Publications", url: "/publications/" },
  { title: "Internships", url: "/#internships" },
  { title: "CV", url: "/cv/" },
];

export const homeNavigation: NavLink[] = [
  { title: "Curriculum Vitae", url: "/files/Resume_en.pdf" },
  { title: "Contact", url: "mailto:david.liu1888888@gmail.com" },
  { title: "GitHub", url: "https://github.com/david188888" },
];
