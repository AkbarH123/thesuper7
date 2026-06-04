<?php
/**
 * Template for the Rules & T&Cs page (auto-applied to a Page with the slug "rules").
 *
 * @package the-super-7
 */

get_header();
?>

<main class="legal-page">
	<div class="container">
		<div class="legal-content">
			<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="back-link">Back to home</a>
			<h1>Rules &amp; Terms</h1>
			<p class="legal-updated">Draft, last updated June 2026</p>

			<div class="legal-note">
				<strong>Heads up:</strong> The Super 7 hasn't launched yet. These rules are a working
				draft and the final, binding terms (including exact prize amounts and eligibility) will
				be published here before the game goes live.
			</div>

			<h2>1. Eligibility</h2>
			<ul>
				<li>You must be 18 or over to play.</li>
				<li>You'll need a free registered account once the game launches.</li>
				<li>Available in eligible regions only (to be confirmed at launch).</li>
			</ul>

			<h2>2. How to play</h2>
			<ul>
				<li>Each gameweek, predict the final score of the game played by each of the seven Super 7 clubs: Arsenal, Chelsea, Liverpool, Manchester City, Manchester United, Newcastle and Tottenham.</li>
				<li>For each of those seven games, also predict that club's first goalscorer.</li>
				<li>If two Super 7 clubs play each other, that fixture fills one slot and a selected "wildcard" fixture fills the seventh, so there are always seven predictions.</li>
			</ul>

			<h2>3. Deadlines</h2>
			<ul>
				<li>Predictions must be submitted before the first of the seven games kicks off (typically Saturday 3:00pm UK time).</li>
				<li>You may edit your slip as many times as you like up until the deadline.</li>
				<li>Once the deadline passes, slips are locked.</li>
			</ul>

			<h2>4. Scoring</h2>
			<ul>
				<li>Correct result (win/draw/loss): points awarded.</li>
				<li>Exact scoreline: a higher points award.</li>
				<li>Correct first goalscorer: bonus points.</li>
				<li>The exact points values will be confirmed before launch.</li>
			</ul>

			<h2>5. Prizes &amp; jackpot</h2>
			<ul>
				<li>The game is free to enter. Cash and prizes are awarded each gameweek.</li>
				<li>A jackpot is offered for correctly predicting all seven results to the exact score; it may be shared between multiple winners and can roll over if not won.</li>
				<li>Additional prizes (top scorer, milestone bonuses, head to head) may apply. Final structure confirmed at launch.</li>
			</ul>

			<h2>6. Tiebreakers</h2>
			<p>Where players are level on points, tiebreakers (such as number of exact scores or correct first scorers) will be used to separate them. The full order of tiebreakers will be published at launch.</p>

			<h2>7. Fair play</h2>
			<p>One account per person. Automated entries, multiple accounts, or any attempt to manipulate results may lead to disqualification.</p>

			<h2>8. Changes to these rules</h2>
			<p>We may update these rules before and after launch. The version published on this page at the time of each gameweek is the one that applies.</p>

			<h2>9. Contact</h2>
			<p>Questions about the rules? Reach us on <a href="https://x.com/thesuper7" target="_blank" rel="noopener">X (@thesuper7)</a>.</p>

			<p class="legal-updated">The Super 7 is an independent prediction game and is not affiliated with, endorsed by, or associated with any football club, the Premier League, or any other organisation.</p>
		</div>
	</div>
</main>

<?php
get_footer();
