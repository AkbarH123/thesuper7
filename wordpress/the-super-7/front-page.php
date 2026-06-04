<?php
/**
 * Front page template (homepage).
 *
 * @package the-super-7
 */

get_header();
$rules_url = esc_url( home_url( '/rules/' ) );
?>

<!-- ===== Hero ===== -->
<section class="hero">
	<div class="hero-bg" aria-hidden="true"></div>
	<div class="container hero-inner">
		<p class="eyebrow">Coming soon</p>
		<h1 class="hero-title">THE <span class="hl">SUPER 7</span></h1>
		<p class="hero-sub">An all new <strong>free to play</strong> prediction game. Win cash &amp; prizes.
			Simply predict the score in each game and the first scorer for each of the Super 7 teams.</p>

		<div class="club-row" id="clubRow" aria-label="The Super 7 clubs"></div>

		<form class="notify" id="notify">
			<input type="email" id="notifyEmail" class="notify-input" placeholder="Enter your email" aria-label="Email address" required />
			<button type="submit" class="btn btn-primary btn-lg" id="notifyBtn">Notify me at launch</button>
		</form>
		<p class="notify-msg" id="notifyMsg" hidden>You're on the list. We'll email you the moment we kick off.</p>

		<div class="hero-cta">
			<a href="#how" class="btn btn-ghost btn-lg">How it works</a>
			<a href="#play" class="btn btn-ghost btn-lg">Try the demo</a>
		</div>

		<div class="jackpot">
			<span class="jackpot-label">Launch jackpot</span>
			<span class="jackpot-amount">&pound;250,000</span>
			<span class="jackpot-note">Rolls over to &pound;1,000,000</span>
		</div>
	</div>
</section>

<!-- ===== How it works ===== -->
<section class="section" id="how">
	<div class="container">
		<h2 class="section-title">How it works</h2>
		<p class="section-lead">It only takes a minute, and it's completely free.</p>
		<div class="steps">
			<div class="step">
				<span class="step-num">1</span>
				<h3>Predict 7 scores</h3>
				<p>Call the exact scoreline for each of the seven Super 7 clubs' fixtures this gameweek.</p>
			</div>
			<div class="step">
				<span class="step-num">2</span>
				<h3>Pick the first scorers</h3>
				<p>For each of the seven Super 7 clubs, predict who'll bag their team's first goal of the game.</p>
			</div>
			<div class="step">
				<span class="step-num">3</span>
				<h3>Beat the deadline</h3>
				<p>Lock in your slip before Saturday 3pm. Edit as many times as you like until then.</p>
			</div>
			<div class="step">
				<span class="step-num">4</span>
				<h3>Win big</h3>
				<p>Points for exact scores, correct results and first scorers. Most points wins, and if you call them all the jackpot is yours.</p>
			</div>
		</div>
	</div>
</section>

<!-- ===== Play / Predictor demo ===== -->
<section class="section section-alt" id="play">
	<div class="container">
		<div class="play-head">
			<div>
				<h2 class="section-title">Sneak peek: your Super 7 slip</h2>
				<p class="section-lead">Gameweek 34. Predict each score and each team's first scorer.</p>
			</div>
			<div class="deadline">
				<span class="deadline-label">Deadline</span>
				<span class="deadline-timer" id="timer">--:--:--</span>
			</div>
		</div>

		<div class="slip">
			<div class="fixtures" id="fixtures"><!-- injected by JS --></div>

			<div class="slip-footer">
				<p class="slip-status" id="slipStatus">0 / 7 predictions made</p>
				<div class="slip-actions">
					<button class="btn btn-ghost" id="clearBtn">Clear slip</button>
					<button class="btn btn-primary btn-lg" id="submitBtn" disabled>Submit predictions</button>
				</div>
			</div>
		</div>
		<p class="demo-note">This is an interactive demo. Predictions save in your browser, with no account or money required.</p>
	</div>
</section>

<!-- ===== Prizes ===== -->
<section class="section" id="prizes">
	<div class="container">
		<h2 class="section-title">Prizes</h2>
		<p class="section-lead">Free to enter, with real cash and prizes up for grabs.</p>
		<div class="prizes">
			<div class="prize prize-feature">
				<span class="prize-tag">The big one</span>
				<span class="prize-amount">&pound;250k</span>
				<p>Correctly predict all <strong>7 scorelines</strong>. Shared between winners, and it rolls to &pound;1m if nobody wins it.</p>
			</div>
			<div class="prize">
				<span class="prize-amount">&pound;1,000</span>
				<p><strong>Get 5 Bonus.</strong> Land five exact scores and bank a grand.</p>
			</div>
			<div class="prize">
				<span class="prize-amount">&pound;5,000</span>
				<p><strong>Top scorer.</strong> Most points in the gameweek when the jackpot isn't won.</p>
			</div>
			<div class="prize">
				<span class="prize-amount">&pound;1,000</span>
				<p><strong>Beat the Pundit.</strong> Outscore our weekly ambassador in a head to head.</p>
			</div>
		</div>
	</div>
</section>

<!-- ===== Leaderboard ===== -->
<section class="section section-alt" id="leaderboard">
	<div class="container">
		<h2 class="section-title">Leaderboard</h2>
		<p class="section-lead">Gameweek 34 top predictors</p>
		<div class="table-wrap">
			<table class="leaderboard">
				<thead>
					<tr><th>#</th><th>Player</th><th>Exact</th><th class="num">Points</th></tr>
				</thead>
				<tbody id="leaderboardBody"><!-- injected by JS --></tbody>
			</table>
		</div>
	</div>
</section>

<!-- ===== FAQ ===== -->
<section class="section" id="faq">
	<div class="container">
		<h2 class="section-title">FAQ</h2>
		<p class="section-lead">Common questions about how it all works.</p>
		<div class="faq">
			<details class="faq-item">
				<summary>Is The Super 7 really free to play?</summary>
				<p>Yes, completely free. There's no entry fee and no purchase required. Just make your predictions and you're in with a chance to win cash and prizes.</p>
			</details>
			<details class="faq-item">
				<summary>How do I play?</summary>
				<p>Each gameweek you predict the final score of all seven Super 7 clubs' games, and pick each club's first goalscorer. Lock in your slip before the deadline and you're done.</p>
			</details>
			<details class="faq-item">
				<summary>When's the deadline?</summary>
				<p>Before the first of the seven games kicks off (usually Saturday at 3pm). You can edit your slip as many times as you like right up until then.</p>
			</details>
			<details class="faq-item">
				<summary>How does scoring work?</summary>
				<p>You earn points for correct results, more points for nailing the exact scoreline, and bonus points for calling a club's first goalscorer. The player with the most points wins. Full detail is in the <a href="<?php echo $rules_url; ?>">Rules &amp; T&amp;Cs</a>.</p>
			</details>
			<details class="faq-item">
				<summary>What can I win?</summary>
				<p>Cash and prizes every gameweek, including a rolling jackpot if you predict everything correctly. Exact prizes are confirmed in the <a href="<?php echo $rules_url; ?>">Rules &amp; T&amp;Cs</a>.</p>
			</details>
			<details class="faq-item">
				<summary>What if two of the Super 7 clubs play each other?</summary>
				<p>That derby fills one slot and a selected "wildcard" fixture fills the seventh, so you're always making seven predictions.</p>
			</details>
			<details class="faq-item">
				<summary>When does it launch?</summary>
				<p>Very soon. Drop your email in the <a href="#notify">Notify me</a> box at the top and we'll let you know the moment it goes live.</p>
			</details>
			<details class="faq-item">
				<summary>Do I need an account?</summary>
				<p>At launch you'll create a free account to save your slips and track your standing on the leaderboard. This site is currently a preview, so no account is needed yet.</p>
			</details>
		</div>
	</div>
</section>

<!-- ===== CTA strip ===== -->
<section class="cta-strip">
	<div class="container cta-inner">
		<h2>Ready to call it?</h2>
		<a href="#play" class="btn btn-primary btn-lg">Make your predictions</a>
	</div>
</section>

<!-- ===== Success modal ===== -->
<div class="modal" id="modal" aria-hidden="true">
	<div class="modal-card">
		<div class="modal-check">&#10003;</div>
		<h3>Slip submitted!</h3>
		<p id="modalText">You're in for Gameweek 34. Good luck!</p>
		<button class="btn btn-primary" id="modalClose">Done</button>
	</div>
</div>

<?php get_footer(); ?>
