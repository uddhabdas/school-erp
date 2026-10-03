"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Users,
  Award,
  BookOpen,
  Calendar,
  Menu,
  X,
  ChevronRight,
  FileText,
  CheckCircle,
  MapPin
} from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) return null;

  const features = [
    { icon: <BookOpen className="w-6 h-6" />, title: "Smart Classrooms", desc: "Modern digital learning facilities" },
    { icon: <Users className="w-6 h-6" />, title: "20+ Expert Faculty", desc: "Highly qualified and experienced teachers" },
    { icon: <Award className="w-6 h-6" />, title: "Well Stocked Library", desc: "Vast collection of books for all subjects" },
    { icon: <GraduationCap className="w-6 h-6" />, title: "Advanced Computer Lab", desc: "Modern computer education" },
    { icon: <Calendar className="w-6 h-6" />, title: "Weekly Exams & Reports", desc: "Regular assessments and digital progress reports" },
    { icon: <CheckCircle className="w-6 h-6" />, title: "Co-curricular Activities", desc: "Sports, cultural and other activities" },
    { icon: <MapPin className="w-6 h-6" />, title: "Best Student-Teacher Ratio", desc: "Personal attention to every student" },
    { icon: <FileText className="w-6 h-6" />, title: "Full Transparency", desc: "All records maintained in ERP system" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-emerald-50/50">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-100 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-4">
              <img src="/image1.png" alt="School" className="h-16 w-16 rounded-2xl object-cover border-4 border-white shadow-xl" />
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-extrabold bg-gradient-to-r from-slate-800 to-slate-700 bg-clip-text text-transparent">
                    Dulichand Sonadevi High School
                  </h1>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold rounded-full ml-2 shadow-md">
                    5T School
                  </span>
                </div>
                <p className="text-slate-600 text-base">
                  Ranamunduli, Basta, Balasore
                </p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="#features" className="text-slate-700 hover:text-blue-700 font-semibold transition">Features</Link>
              <Link href="#about" className="text-slate-700 hover:text-blue-700 font-semibold transition">About Us</Link>
              <Link href="/admissions/apply" className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-semibold shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
                Apply Now
              </Link>
              <Link href="/login" className="px-5 py-2.5 bg-slate-100 text-slate-800 rounded-full font-semibold hover:bg-slate-200 transition-all duration-300">
                Login
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-slate-100"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6 text-slate-700" /> : <Menu className="w-6 h-6 text-slate-700" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="mt-4 flex flex-col gap-3 py-4 border-t border-slate-100 md:hidden">
              <Link href="#features" onClick={() => setIsMenuOpen(false)} className="text-slate-700 font-semibold py-1.5">Features</Link>
              <Link href="#about" onClick={() => setIsMenuOpen(false)} className="text-slate-700 font-semibold py-1.5">About Us</Link>
              <Link href="/admissions/apply" onClick={() => setIsMenuOpen(false)} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-semibold text-center">
                Apply Now
              </Link>
              <Link href="/login" onClick={() => setIsMenuOpen(false)} className="px-5 py-2.5 bg-slate-100 text-slate-800 rounded-full font-semibold text-center">
                Login
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-100 to-teal-100 px-5 py-2 rounded-full border border-emerald-200 shadow-md">
                <img src="/5tlogo.png" alt="5T Logo" className="w-10 h-10 rounded-full" />
                <span className="text-emerald-800 font-bold text-base">Admission Open 2026-27</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-tight text-slate-900">
                Building Future
                <span className="block bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                  Leaders
                </span>
              </h1>
              <p className="text-xl text-slate-700 max-w-2xl">
                Empowering young minds through quality education, character building, and holistic development for a bright tomorrow.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/admissions/apply" className="flex items-center justify-center gap-2 px-10 py-4.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xl font-bold rounded-full shadow-xl shadow-emerald-300 hover:shadow-emerald-400 transition-all duration-300 transform hover:-translate-y-1">
                  Apply for Admission <ChevronRight className="w-6 h-6" />
                </Link>
                <Link href="#about" className="flex items-center justify-center gap-2 px-8 py-4 border-2 border-slate-300 text-slate-800 text-lg font-semibold rounded-full hover:bg-slate-50 transition-all duration-300">
                  Learn More
                </Link>
              </div>
            </div>

            {/* School Image */}
            <div className="relative">
              <div className="relative overflow-hidden rounded-3xl shadow-2xl border-4 border-white">
                <img src="/image1.png" alt="School Building" className="w-full h-auto object-cover" />
              </div>
              <img src="/image2.png" alt="School Campus" className="absolute -bottom-6 -right-6 w-40 h-40 object-cover rounded-2xl border-4 border-white shadow-xl hidden sm:block" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-100">
              <p className="text-4xl font-bold text-blue-700">VIII-X</p>
              <p className="text-slate-700 font-semibold">Classes</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 border border-green-100">
              <p className="text-4xl font-bold text-green-700">200+</p>
              <p className="text-slate-700 font-semibold">Students</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-100">
              <p className="text-4xl font-bold text-yellow-700">20+</p>
              <p className="text-slate-700 font-semibold">Teachers</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-100">
              <p className="text-4xl font-bold text-purple-700">5T</p>
              <p className="text-slate-700 font-semibold">Certified</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
              Why Choose Our School?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 hover:bg-blue-50 hover:shadow-xl transition-all duration-300 group shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mb-4 text-blue-700 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-16 sm:py-24 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-white p-8 rounded-3xl shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center mb-6">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Our Vision</h3>
              <p className="text-slate-700 leading-relaxed">
                To be a leading educational institution that nurtures young minds, fosters creativity, and develops responsible citizens who contribute positively to society.
              </p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center mb-6">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Our Mission</h3>
              <p className="text-slate-700 leading-relaxed">
                To provide holistic education that combines academic excellence with character building, physical fitness, and social responsibility.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-16 sm:py-24 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-extrabold">
                Dulichand Sonadevi High School
              </h2>
              <p className="text-lg text-slate-300">
                Established with a vision to provide quality education in rural Odisha, our school is proud to be a <span className="text-yellow-400 font-bold">5T School</span> certified institution.
              </p>
              <p className="text-slate-300">
                Affiliated to the Board of Secondary Education, Odisha (BSE), we offer education from Class VIII to Class X with a focus on holistic development.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                <h4 className="font-bold text-xl text-yellow-400">Future Plans</h4>
                <ul className="mt-2 space-y-1 text-slate-200">
                  <li>🏫 Modern Hostel Facility</li>
                  <li>⚽ Sports Complex</li>
                  <li>🔬 Advanced Science Lab</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-8 justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/5tlogo.png" alt="5T Logo" className="h-12 w-12 rounded-full" />
              <div>
                <h3 className="text-xl font-bold text-white">
                  Dulichand Sonadevi High School
                </h3>
                <p className="text-sm">
                  Ranamunduli, Basta, Balasore, Odisha
                </p>
              </div>
            </div>
          </div>
          <div className="text-center md:text-right text-slate-400 mt-8">
            <p className="text-sm">© {new Date().getFullYear()} All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
