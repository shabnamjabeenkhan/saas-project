import { Link } from "react-router";

const links = [
    {
        title: 'Features',
        href: '/#features',
    },
    {
        title: 'Pricing',
        href: '/pricing',
    },
    {
        title: 'Help',
        href: '/#faq',
    },
    {
        title: 'About',
        href: '/#about',
    },
]

const legalLinks = [
    {
        title: 'Terms of Service',
        href: '/terms',
    },
    {
        title: 'Privacy Policy',
        href: '/privacy',
    },
    {
        title: 'Refund Policy',
        href: '/refund',
    },
]

export default function FooterSection() {
    return (
        <footer className="bg-background py-16">
            <div className="mx-auto max-w-5xl px-6">
                <Link
                    to="/"
                    aria-label="go home"
                    className="mx-auto block size-fit">
                    <span className="text-2xl font-bold">TradeBoost AI</span>
                </Link>

                <div className="my-8 flex flex-wrap justify-center gap-6">
                    {links.map((link, index) => (
                        <Link
                            key={index}
                            to={link.href}
                            className="text-muted-foreground hover:text-primary block duration-150">
                            <span>{link.title}</span>
                        </Link>
                    ))}
                </div>

                <div className="my-6 flex flex-wrap justify-center gap-4 text-sm">
                    {legalLinks.map((link, index) => (
                        <Link
                            key={index}
                            to={link.href}
                            className="text-muted-foreground hover:text-primary text-xs">
                            {link.title}
                        </Link>
                    ))}
                </div>

                <span className="text-muted-foreground block text-center text-sm"> © {new Date().getFullYear()} TradeBoost AI, All rights reserved</span>
            </div>
        </footer>
    );
}
