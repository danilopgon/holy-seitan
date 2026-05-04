"use client"

type ViewTransitionAPI = {
	startViewTransition: (updateCallback: () => void) => void
}

function hasViewTransitionAPI(documentRef: Document): documentRef is Document & ViewTransitionAPI {
	return typeof (documentRef as Document & Partial<ViewTransitionAPI>).startViewTransition === "function"
}

export function startViewTransitionIfAvailable(updateCallback: () => void) {
	if (!hasViewTransitionAPI(document)) {
		updateCallback()
		return
	}

	document.startViewTransition(updateCallback)
}

export function getEmojiTransitionName(slug: string) {
	return `recipe-emoji-${slug}`
}
