export default function Footer() {
  return (
    <footer className="border-t py-3 text-center text-sm text-muted-foreground">
      <div className="container mx-auto">© {new Date().getFullYear()} Storefront</div>
    </footer>
  );
}
