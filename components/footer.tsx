export function Footer() {
	return (
		<footer className="border-t border-border mt-16 py-8">
			<div className="container mx-auto px-4 text-center text-sm text-muted-foreground font-mono space-y-1">
				<p>
					Holy Seitan - Hecho con 🌱 y código por{" "}
					<a
						href="https://danilopgon.com"
						className="font-medium text-foreground underline decoration-primary/60 underline-offset-4 transition-colors hover:text-primary hover:decoration-primary focus-visible:text-primary focus-visible:outline-none focus-visible:decoration-primary"
					>
						Dani
					</a>
				</p>
				<p>
					Cocinado digitalmente por{" "}
					<a
						href="https://grajoestudio.dev"
						className="font-medium text-foreground underline decoration-primary/60 underline-offset-4 transition-colors hover:text-primary hover:decoration-primary focus-visible:text-primary focus-visible:outline-none focus-visible:decoration-primary"
					>
						Grajo Estudio
					</a>
				</p>
			</div>
		</footer>
	);
}
