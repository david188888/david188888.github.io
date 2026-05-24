import { ArchiveItem } from "@/components/cards/ArchiveItem";

const posts = [
  {
    title: "Future Post",
    permalink: "/posts/2199/01/future-post/",
    date: "2199-01-01",
    excerpt: "This is a future post placeholder.",
    tags: ["placeholder"],
  },
  {
    title: "Blog Post Number 4",
    permalink: "/posts/2015/08/blog-post-4/",
    date: "2015-08-14",
    excerpt: "This is a sample blog post. Lorem ipsum dolor sit amet consectetur.",
    tags: ["sample post"],
  },
  {
    title: "Blog Post Number 3",
    permalink: "/posts/2014/08/blog-post-3/",
    date: "2014-08-14",
    excerpt: "This is a sample blog post. Lorem ipsum dolor sit amet consectetur.",
    tags: ["sample post"],
  },
  {
    title: "Blog Post Number 2",
    permalink: "/posts/2013/08/blog-post-2/",
    date: "2013-08-14",
    excerpt: "This is a sample blog post. Lorem ipsum dolor sit amet consectetur.",
    tags: ["sample post"],
  },
  {
    title: "Blog Post Number 1",
    permalink: "/posts/2012/08/blog-post-1/",
    date: "2012-08-14",
    excerpt: "This is a sample blog post. Lorem ipsum dolor sit amet consectetur.",
    tags: ["sample post"],
  },
];

export default function PostsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-[var(--global-text-color)]">
        Posts
      </h1>
      <div className="mb-8">
        {posts.map((post) => (
          <ArchiveItem key={post.title} {...post} />
        ))}
      </div>
    </div>
  );
}
