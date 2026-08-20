import React, { useState, useEffect } from "react";

// Mocking your new API Response structure with plain text long-form content
const apiResponse = {
    success: true,
    posts: [
        {
            _id: "post_1",
            title: "Building the Future with Technology",
            slug: "building-the-future-with-technology",
            content: `The landscape of software engineering is shifting rapidly. As we stand on the brink of Web3, AI-driven development, and quantum computing, the tools we use today might become obsolete tomorrow. But one thing remains constant: the engineering mindset.

The Rise of AI-Assisted Development
Artificial Intelligence is no longer just a buzzword; it's a co-pilot. Tools like GitHub Copilot and ChatGPT are changing how we write boilerplate code, allowing developers to focus on architecture and complex logic rather than syntax. Embracing these tools doesn't make you less of a programmer; it makes you a more efficient architect of the future.

Decentralization and Edge Architecture
Moving away from monolithic servers, edge computing pushes data processing closer to the user. This reduces latency and bandwidth use, opening doors for real-time applications that were previously impossible. For students entering the field, understanding distributed systems is no longer optional—it's a necessity.

As we continue to build, remember that technology is just a tool. The real magic lies in how we apply it to solve genuine human problems.`,
            summary: "Explore the latest technologies, development practices, and ideas shaping the future of software engineering.",
            coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop",
            category: "TECHNOLOGY",
            tags: ["Innovation", "Future", "Engineering"],
            author: {
                _id: "user_1",
                firstName: "Aarav",
                lastName: "Sharma",
                image: "https://i.pravatar.cc/150?u=aarav",
                role: "admin"
            },
            status: "published",
            createdAt: "2026-08-18T10:00:00Z",
        },
        {
            _id: "post_2",
            title: "How to Get Better at Data Structures & Algorithms",
            slug: "how-to-get-better-at-dsa",
            content: `Mastering Data Structures and Algorithms (DSA) is often seen as a daunting task, usually associated with gruelling technical interviews. However, DSA is fundamentally about problem-solving and efficiency.

Stop Memorizing, Start Visualizing
The biggest mistake beginners make is trying to memorize solutions. Instead, draw the problem out. If it's a linked list, draw the nodes and pointers. If it's a graph, sketch the vertices and edges. Visualizing the state changes step-by-step makes it much easier to translate logic into code.

Pattern Recognition
Most competitive programming problems are variations of a few core patterns: Sliding Window, Two Pointers, Fast & Slow Pointers, Merge Intervals, and Top K Elements. Once you master the pattern, the specific problem becomes a simple implementation detail.

Consistency is key. Solving one problem every day for a month is vastly superior to cramming 30 problems into a single weekend. Build the habit, and the intuition will follow.`,
            summary: "A practical guide to improving your problem-solving skills and becoming better at competitive programming.",
            coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop",
            category: "DSA",
            tags: ["Algorithms", "Coding", "Interview Prep"],
            author: {
                _id: "user_2",
                firstName: "Riya",
                lastName: "Patel",
                image: "https://i.pravatar.cc/150?u=riya",
                role: "contributor"
            },
            status: "published",
            createdAt: "2026-08-15T14:30:00Z",
        },
        {
            _id: "post_3",
            title: "From Ideas to Real-World Projects",
            slug: "ideas-to-real-world-projects",
            content: `Every great application starts as a fleeting thought. But transitioning an idea from a whiteboard into a deployed, scalable web application requires discipline and a structured approach.

The MVP (Minimum Viable Product) Mindset
Don't try to build the next Facebook in your first sprint. Identify the core feature that solves the primary problem and build only that. If you are building a task manager, ensure a user can add and complete a task before you start adding complex user authentication and dark mode toggles.

Version Control and CI/CD
Treat your personal projects like professional software. Use Git effectively—write descriptive commit messages and use branches for new features. Setting up a simple CI/CD pipeline using GitHub Actions to automatically deploy your site to Vercel or Netlify when you push to the main branch is a game-changer.

A finished project that works is always better than a perfect project that lives only on your localhost.`,
            summary: "Learn how students can turn their ideas into meaningful projects and build a portfolio that stands out.",
            coverImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=2072&auto=format&fit=crop",
            category: "WEB DEVELOPMENT",
            tags: ["Projects", "Portfolio", "WebDev"],
            author: {
                _id: "user_3",
                firstName: "Kabir",
                lastName: "Singh",
                image: "https://i.pravatar.cc/150?u=kabir",
                role: "editor"
            },
            status: "published",
            createdAt: "2026-08-12T09:15:00Z",
        },
        {
            _id: "post_4",
            title: "Why Communities Matter in Tech",
            slug: "why-communities-matter-in-tech",
            content: `The stereotype of the lone programmer coding in a dark basement is a myth. Modern software development is a deeply collaborative process, and communities are the lifeblood of this ecosystem.

Accelerated Learning
When you join a tech community, you surround yourself with individuals at various stages of their journey. A bug that might take you three days to fix alone can often be resolved in three minutes by a senior member of your community. More importantly, explaining concepts to beginners solidifies your own understanding.

Networking and Opportunities
Your network is your net worth. Hackathons, meetups, and open-source contributions are excellent ways to meet potential co-founders, mentors, and employers. Many unlisted job opportunities are filled through community referrals before they even make it to job boards.

Get involved, ask questions without fear of judgement, and give back when you can.`,
            summary: "Discover how technical communities help students learn faster, collaborate better, and grow together.",
            coverImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop",
            category: "COMMUNITY",
            tags: ["Community", "Growth", "Networking"],
            author: {
                _id: "user_4",
                firstName: "Ananya",
                lastName: "Verma",
                image: "https://i.pravatar.cc/150?u=ananya",
                role: "contributor"
            },
            status: "published",
            createdAt: "2026-08-08T16:45:00Z",
        },
        {
            _id: "post_5",
            title: "Inside Our Latest Tech Events",
            slug: "inside-our-latest-tech-events",
            content: `This past semester has been nothing short of electrifying for the GFG BVCOE chapter. We've hosted a series of events designed to bridge the gap between academic theory and industry practice.

The 48-Hour Hackathon
Over 200 students participated in our flagship hackathon. We saw incredible projects ranging from AI-driven mental health chatbots to decentralized voting systems on the blockchain. The energy in the room at 3:00 AM, fueled by pizza and caffeine, was a testament to our community's passion.

Industry Speaker Series
We were fortunate to host senior engineers from leading tech giants who shared insights on system design, navigating early careers, and the importance of soft skills in a technical environment.

Thank you to everyone who participated, volunteered, and organized. Stay tuned for our upcoming schedule!`,
            summary: "A look back at workshops, competitions, sessions, and activities organized for our student community.",
            coverImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop",
            category: "EVENTS",
            tags: ["Events", "Workshops", "Hackathons"],
            author: {
                _id: "user_1",
                firstName: "Aarav",
                lastName: "Sharma",
                image: "https://i.pravatar.cc/150?u=aarav",
                role: "admin"
            },
            status: "published",
            createdAt: "2026-08-03T11:00:00Z",
        },
        {
            _id: "post_6",
            title: "Preparing Yourself for the Tech Industry",
            slug: "preparing-yourself-for-the-tech-industry",
            content: `Transitioning from academia to the professional tech industry requires more than just knowing how to code. It requires a holistic approach to professional development.

Building a Standout Resume
Your resume is your first impression. Keep it to one page, highlight quantifiable achievements (e.g., "Reduced load time by 30%"), and showcase projects that solve real problems rather than just generic tutorials.

The Importance of Soft Skills
Communication is highly underrated in engineering. You must be able to explain complex technical concepts to non-technical stakeholders. Code reviews, pair programming, and documentation all require excellent communication skills.

Finally, practice mock interviews. The technical interview format is a specific skill that requires practice independently of your day-to-day coding abilities.`,
            summary: "The skills, projects, experiences, and habits that can help students prepare for their first opportunity.",
            coverImage: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2084&auto=format&fit=crop",
            category: "CAREER",
            tags: ["Career", "Jobs", "Internships"],
            author: {
                _id: "user_2",
                firstName: "Riya",
                lastName: "Patel",
                image: "https://i.pravatar.cc/150?u=riya",
                role: "contributor"
            },
            status: "published",
            createdAt: "2026-07-28T13:20:00Z",
        }
    ]
};

const posts = apiResponse.posts;

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
    }).toUpperCase();
};

export default function Blog() {
    const featuredPost = posts[0];
    const regularPosts = posts.slice(1);
    
    // State to manage the currently selected post for the modal
    const [selectedPost, setSelectedPost] = useState(null);

    // Prevent scrolling on the body when the modal is open
    useEffect(() => {
        if (selectedPost) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => { document.body.style.overflow = "auto"; };
    }, [selectedPost]);

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#020b08] text-[#e8f1ed]">
            {/* ================= BACKGROUND ================= */}
            <div
                className="pointer-events-none fixed inset-0 opacity-40"
                style={{
                    backgroundImage: "radial-gradient(rgba(24,205,93,0.18) 1px, transparent 1px)",
                    backgroundSize: "34px 34px",
                }}
            />
            <div className="pointer-events-none fixed -right-48 top-24 h-[700px] w-[700px] rounded-full bg-green-500/[0.035] blur-[100px]" />

            {/* ================= NAVBAR ================= */}
            <nav className="relative z-10 flex h-[78px] items-center justify-between border-b border-emerald-900/20 bg-[#020c08]/80 px-[9%] backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#effff6] text-[13px] font-extrabold text-green-600">
                        GFG
                    </div>
                    <div className="text-[22px] font-bold tracking-tight text-gray-100">
                        GFG<span className="text-[#35d879]">xBVCOE</span>
                    </div>
                </div>

                <div className="hidden items-center gap-1 md:flex">
                    <a href="/" className="rounded-full px-4 py-2.5 text-sm font-medium text-[#b8c4bf] transition hover:bg-green-500/10 hover:text-white">Home</a>
                    <a href="/about" className="rounded-full px-4 py-2.5 text-sm font-medium text-[#b8c4bf] transition hover:bg-green-500/10 hover:text-white">About</a>
                    <a href="/team" className="rounded-full px-4 py-2.5 text-sm font-medium text-[#b8c4bf] transition hover:bg-green-500/10 hover:text-white">Team</a>
                    <a href="/events" className="rounded-full px-4 py-2.5 text-sm font-medium text-[#b8c4bf] transition hover:bg-green-500/10 hover:text-white">Events</a>
                    <a href="/gallery" className="rounded-full px-4 py-2.5 text-sm font-medium text-[#b8c4bf] transition hover:bg-green-500/10 hover:text-white">Gallery</a>
                    <a href="/contact" className="rounded-full px-4 py-2.5 text-sm font-medium text-[#b8c4bf] transition hover:bg-green-500/10 hover:text-white">Contact</a>
                    <a href="/blog" className="ml-1 rounded-full border border-green-400/30 bg-green-700/20 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(0,255,100,0.08)]">Blog</a>
                </div>
            </nav>

            {/* ================= HERO ================= */}
            <section className="relative z-10 mx-auto w-[82%] max-w-[1250px] pb-20 pt-[105px]">
                <div className="inline-flex items-center gap-2 rounded-full border border-green-400/25 bg-green-700/[0.08] px-3.5 py-2 text-[11px] font-bold tracking-[1.5px] text-[#55df8b]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#32d875] shadow-[0_0_10px_#32d875]" />
                    GFG BVCOE JOURNAL
                </div>

                <h1 className="mt-7 max-w-[950px] text-[58px] font-bold leading-[0.94] tracking-[-4px] sm:text-[75px] md:text-[90px] lg:text-[108px]">
                    Ideas that
                    <br />
                    <span className="text-[#39d878] [text-shadow:0_0_35px_rgba(43,220,113,0.12)]">
                        build the future.
                    </span>
                </h1>

                <p className="mt-9 max-w-[630px] text-[15px] leading-7 text-[#a3b2ab] sm:text-[17px]">
                    Explore technical insights, student experiences, development
                    resources, event stories, and everything happening inside the GFG
                    BVCOE community.
                </p>

                <div className="mt-16 h-px w-full bg-gradient-to-r from-green-500/40 via-green-500/[0.08] to-transparent" />
            </section>

            {/* ================= BLOG CONTENT ================= */}
            <main className="relative z-10 mx-auto w-[82%] max-w-[1250px] pb-28">
                <div className="mb-6 flex items-center justify-between">
                    <div className="text-sm font-semibold tracking-[1.5px] text-[#d8e5df]">
                        LATEST STORIES
                    </div>
                    <div className="text-[11px] tracking-[1px] text-[#63736c]">
                        01 — 06
                    </div>
                </div>

                {/* ================= FEATURED ARTICLE ================= */}
                {featuredPost && (
                    <article 
                        onClick={() => setSelectedPost(featuredPost)}
                        className="group grid min-h-[430px] overflow-hidden rounded-3xl border border-green-800/30 bg-gradient-to-br from-[#092619]/80 to-[#03110b]/90 shadow-[0_20px_70px_rgba(0,0,0,0.22)] lg:grid-cols-[1.15fr_1fr] cursor-pointer transition-transform hover:scale-[1.01]"
                    >
                        {/* Visual with Cover Image */}
                        <div className="relative min-h-[350px] overflow-hidden bg-[#03130c]">
                            <img
                                src={featuredPost.coverImage}
                                alt={featuredPost.title}
                                className="absolute inset-0 h-full w-full object-cover opacity-50 mix-blend-luminosity transition duration-700 group-hover:scale-105 group-hover:opacity-70 group-hover:mix-blend-normal"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-[#092619]/90 to-transparent" />
                            <div
                                className="absolute inset-0 opacity-50"
                                style={{
                                    backgroundImage:
                                        "linear-gradient(rgba(57,216,120,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(57,216,120,0.08) 1px, transparent 1px)",
                                    backgroundSize: "45px 45px",
                                }}
                            />
                        </div>

                        {/* Content */}
                        <div className="flex flex-col justify-between p-8 sm:p-10 lg:p-12">
                            <div>
                                <div className="text-[11px] font-bold tracking-[1.7px] text-[#48db83]">
                                    FEATURED · {featuredPost.category}
                                </div>

                                <h2 className="mt-6 text-[32px] font-bold leading-tight tracking-[-2px] sm:text-[40px] lg:text-[48px] group-hover:text-[#39d878] transition-colors">
                                    {featuredPost.title}
                                </h2>

                                <p className="mt-5 max-w-[500px] text-sm leading-7 text-[#91a19a]">
                                    {featuredPost.summary}
                                </p>
                            </div>

                            {/* Author & Date Footer */}
                            <div className="mt-8 flex items-center justify-between border-t border-green-900/30 pt-5 text-[10px] tracking-[1px] text-[#627169]">
                                <div className="flex items-center gap-2">
                                    <img 
                                        src={featuredPost.author.image} 
                                        alt={featuredPost.author.firstName} 
                                        className="h-6 w-6 rounded-full border border-green-900/50"
                                    />
                                    <span className="uppercase font-medium text-[#82928a]">
                                        BY {featuredPost.author.firstName} {featuredPost.author.lastName}
                                    </span>
                                </div>
                                <span>{formatDate(featuredPost.createdAt)}</span>
                            </div>
                        </div>
                    </article>
                )}

                {/* ================= REGULAR POSTS ================= */}
                <div className="mt-[75px] grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {regularPosts.map((post) => (
                        <article
                            key={post._id}
                            onClick={() => setSelectedPost(post)}
                            className="group flex min-h-[480px] cursor-pointer flex-col overflow-hidden rounded-3xl border border-green-900/25 bg-[#04120c]/70 shadow-[0_15px_50px_rgba(0,0,0,0.18)] transition duration-500 hover:-translate-y-1 hover:border-green-500/35 hover:bg-[#071d12] hover:shadow-[0_20px_60px_rgba(15,180,80,0.08)]"
                        >
                            {/* ================= CARD VISUAL ================= */}
                            <div className="relative h-[220px] overflow-hidden bg-[#03130c]">
                                <img 
                                    src={post.coverImage} 
                                    alt={post.title}
                                    className="absolute inset-0 h-full w-full object-cover opacity-60 transition duration-700 group-hover:scale-110 group-hover:opacity-100"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#04120c] via-[#04120c]/40 to-transparent" />
                                
                                <div className="absolute left-6 top-6 rounded-full border border-green-400/20 bg-[#03130c]/70 px-3 py-1.5 text-[9px] font-bold tracking-[1.5px] text-[#55df8b] backdrop-blur-md">
                                    {post.category}
                                </div>
                            </div>

                            {/* ================= CARD CONTENT ================= */}
                            <div className="flex flex-1 flex-col justify-between p-6 sm:p-7">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <div className="text-[10px] font-bold tracking-[1.5px] text-[#48db83]">
                                            GFG × BVCOE
                                        </div>
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-green-900/40 text-[16px] text-[#91a49a] transition duration-300 group-hover:rotate-45 group-hover:border-green-400/40 group-hover:bg-green-500 group-hover:text-white">
                                            ↗
                                        </div>
                                    </div>

                                    <h3 className="mt-5 text-[23px] font-semibold leading-[1.15] tracking-[-1px] text-[#e5eeea] group-hover:text-[#39d878] transition-colors">
                                        {post.title}
                                    </h3>

                                    <p className="mt-4 text-[13px] leading-6 text-[#82928a]">
                                        {post.summary}
                                    </p>
                                </div>

                                <div className="mt-8 flex items-center justify-between border-t border-green-900/25 pt-4 text-[9px] font-medium tracking-[1px] text-[#58675f]">
                                    <div className="flex items-center gap-2">
                                        <img 
                                            src={post.author.image} 
                                            alt={post.author.firstName} 
                                            className="h-5 w-5 rounded-full border border-green-900/40"
                                        />
                                        <span className="uppercase">
                                            {post.author.firstName} {post.author.lastName}
                                        </span>
                                    </div>
                                    <span>{formatDate(post.createdAt)}</span>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>

                {/* ================= CTA ================= */}
                <section className="mt-[90px] flex flex-col items-start justify-between gap-8 rounded-3xl border border-green-800/30 bg-[#04150d]/70 p-8 sm:p-12 lg:flex-row lg:items-center">
                    <div>
                        <h2 className="text-[29px] font-bold tracking-[-1.5px] text-[#e5eeea] sm:text-[36px]">
                            Have something to share?
                        </h2>
                        <p className="mt-2 text-sm text-[#819088]">
                            Write, build, collaborate and contribute to the GFG BVCOE community.
                        </p>
                    </div>

                    <a
                        href="/contact"
                        className="inline-flex items-center gap-3 rounded-full bg-[#16a957] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(19,190,82,0.14)] transition hover:-translate-y-0.5 hover:bg-[#1fc568] hover:shadow-[0_10px_35px_rgba(19,210,88,0.22)]"
                    >
                        Get Involved
                        <span>↗</span>
                    </a>
                </section>
            </main>

            {/* ================= FOOTER ================= */}
            <footer className="relative z-10 mx-auto flex w-[82%] max-w-[1250px] flex-col justify-between gap-5 border-t border-green-900/20 py-9 text-[11px] text-[#53615a] sm:flex-row">
                <div>© 2026 GFG × BVCOE</div>

                <div className="flex gap-6">
                    <a href="/" className="text-[#65746c] transition hover:text-[#39d878]">Home</a>
                    <a href="/about" className="text-[#65746c] transition hover:text-[#39d878]">About</a>
                    <a href="/contact" className="text-[#65746c] transition hover:text-[#39d878]">Contact</a>
                </div>
            </footer>

            {/* ================= POST MODAL (SIMULATIVE DIV) ================= */}
            {selectedPost && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-[#020b08]/80 transition-opacity">
                    {/* Background click listener to close */}
                    <div 
                        className="absolute inset-0 cursor-pointer" 
                        onClick={() => setSelectedPost(null)}
                    />
                    
                    <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-green-500/20 bg-[#04120c] shadow-[0_25px_80px_rgba(0,0,0,0.5)] scrollbar-hide">
                        
                        {/* Close Button */}
                        <button 
                            onClick={() => setSelectedPost(null)}
                            className="absolute top-5 right-5 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-[#a3b2ab] backdrop-blur-md transition hover:bg-green-500/20 hover:text-white"
                        >
                            ✕
                        </button>

                        {/* Modal Cover Image */}
                        <div className="relative h-[250px] w-full sm:h-[350px]">
                            <img 
                                src={selectedPost.coverImage} 
                                alt={selectedPost.title} 
                                className="h-full w-full object-cover opacity-80"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#04120c] to-transparent" />
                        </div>

                        {/* Modal Body */}
                        <div className="px-6 pb-12 sm:px-12">
                            <div className="relative -mt-16 sm:-mt-24">
                                <span className="inline-block rounded-full border border-green-400/20 bg-[#03130c]/90 px-4 py-2 text-[10px] font-bold tracking-[1.5px] text-[#55df8b] backdrop-blur-md">
                                    {selectedPost.category}
                                </span>
                                
                                <h2 className="mt-4 text-[32px] font-bold leading-tight tracking-[-1px] text-white sm:text-[46px]">
                                    {selectedPost.title}
                                </h2>

                                {/* Modal Author Info */}
                                <div className="mt-6 flex items-center gap-4 border-b border-green-900/30 pb-6">
                                    <img 
                                        src={selectedPost.author.image} 
                                        alt={selectedPost.author.firstName} 
                                        className="h-12 w-12 rounded-full border-2 border-green-900/50"
                                    />
                                    <div>
                                        <div className="text-sm font-semibold text-[#e8f1ed]">
                                            {selectedPost.author.firstName} {selectedPost.author.lastName}
                                        </div>
                                        <div className="text-[11px] text-[#63736c] tracking-[1px] uppercase mt-1">
                                            {formatDate(selectedPost.createdAt)} • {selectedPost.author.role}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Rendered Plain Text Content (using whitespace-pre-wrap to maintain line breaks) */}
                            <div className="mt-8 whitespace-pre-wrap text-[15px] leading-8 text-[#9eb3a8] sm:text-[17px]">
                                {selectedPost.content}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Simple style to hide scrollbar inside modal but allow scrolling */}
            <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}