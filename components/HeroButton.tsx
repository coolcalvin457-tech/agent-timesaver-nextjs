import Link from "next/link";

export default function HeroButton() {
  return (
    <Link href="/agents" className="btn btn-primary btn-lg">
      Get Started
    </Link>
  );
}
