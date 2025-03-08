export default function Footer() {
  return (
    <footer className="py-4 border-t bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto text-center text-sm text-muted-foreground">
        Phonara &copy; {new Date().getFullYear()} - Breaking language barriers in healthcare
      </div>
    </footer>
  )
} 