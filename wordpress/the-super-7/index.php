<?php
/**
 * Fallback template (used for blog/archive/single when no more specific template exists).
 *
 * @package the-super-7
 */

get_header();
?>

<main class="legal-page">
	<div class="container">
		<div class="legal-content">
			<?php
			if ( have_posts() ) :
				while ( have_posts() ) :
					the_post();
					?>
					<article <?php post_class(); ?>>
						<h1><?php the_title(); ?></h1>
						<div class="entry-content">
							<?php the_content(); ?>
						</div>
					</article>
					<?php
				endwhile;

				the_posts_pagination();
			else :
				?>
				<h1>Nothing here yet</h1>
				<p>There's no content to show. Head <a href="<?php echo esc_url( home_url( '/' ) ); ?>">back to the home page</a>.</p>
				<?php
			endif;
			?>
		</div>
	</div>
</main>

<?php
get_footer();
