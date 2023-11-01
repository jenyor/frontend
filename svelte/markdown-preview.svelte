<script>
	import { marked } from 'marked';
	let value = "";
</script>

<div class="grid">
	input
	<textarea bind:value></textarea>

	output
	<div>{@html marked(value)}</div>
</div>

<style>
	.grid {
		display: grid;
		grid-gap: 1em;
	}

	textarea {
		flex: 1;
		resize: none;
		min-height: 200px;
	}
</style>
