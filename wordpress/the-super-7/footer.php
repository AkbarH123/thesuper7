<?php
/**
 * Footer template.
 *
 * @package the-super-7
 */
?>
<footer class="site-footer">
	<div class="container footer-inner">
		<div class="footer-brand">
			<img src="<?php echo esc_url( get_template_directory_uri() . '/brand/assets/logo.png' ); ?>" alt="The Super 7" class="brand-mark" />
		</div>
		<nav class="footer-nav">
			<a href="<?php echo esc_url( home_url( '/#how' ) ); ?>">How it works</a>
			<a href="<?php echo esc_url( home_url( '/#play' ) ); ?>">Play</a>
			<a href="<?php echo esc_url( home_url( '/#prizes' ) ); ?>">Prizes</a>
			<a href="<?php echo esc_url( home_url( '/#leaderboard' ) ); ?>">Leaderboard</a>
			<a href="<?php echo esc_url( home_url( '/#faq' ) ); ?>">FAQ</a>
			<a href="<?php echo esc_url( home_url( '/rules/' ) ); ?>">Rules &amp; T&amp;Cs</a>
		</nav>
		<div class="socials">
			<a class="social" href="https://x.com/thesuper7" target="_blank" rel="noopener" aria-label="The Super 7 on X (Twitter)">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
					<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
				</svg>
			</a>
		</div>
		<p class="footer-legal">&copy; <?php echo esc_html( wp_date( 'Y' ) ); ?> The Super 7. Free to play. 18+. Not affiliated with any club or league.</p>
	</div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
