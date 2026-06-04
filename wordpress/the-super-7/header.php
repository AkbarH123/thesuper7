<?php
/**
 * Header template.
 *
 * @package the-super-7
 */
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<header class="site-header" id="top">
	<div class="container header-inner">
		<a class="brand" href="<?php echo esc_url( home_url( '/' ) ); ?>">
			<img src="<?php echo esc_url( get_template_directory_uri() . '/brand/assets/logo.png' ); ?>" alt="The Super 7" class="brand-mark" />
		</a>
		<nav class="nav" id="nav">
			<a href="<?php echo esc_url( home_url( '/#how' ) ); ?>">How it works</a>
			<a href="<?php echo esc_url( home_url( '/#play' ) ); ?>">Play</a>
			<a href="<?php echo esc_url( home_url( '/#prizes' ) ); ?>">Prizes</a>
			<a href="<?php echo esc_url( home_url( '/#leaderboard' ) ); ?>">Leaderboard</a>
			<a href="<?php echo esc_url( home_url( '/#faq' ) ); ?>">FAQ</a>
		</nav>
		<div class="header-actions">
			<a href="<?php echo esc_url( home_url( '/#play' ) ); ?>" class="btn btn-ghost">Try the demo</a>
			<a href="<?php echo esc_url( home_url( '/#notify' ) ); ?>" class="btn btn-primary">Notify me</a>
		</div>
		<button class="menu-toggle" id="menuToggle" aria-label="Menu">&#9776;</button>
	</div>
</header>
