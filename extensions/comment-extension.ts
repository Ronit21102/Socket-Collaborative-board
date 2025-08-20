import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"
import type * as Y from "yjs"

export interface Comment {
  id: string
  author: string
  content: string
  timestamp: number
  replies: Comment[]
  resolved: boolean
  range: {
    from: number
    to: number
  }
}

export interface CommentExtensionOptions {
  ydoc: Y.Doc
  onCommentClick: (commentId: string) => void
  onAddComment: (range: { from: number; to: number }, content: string) => void
}

export const CommentExtension = Extension.create<CommentExtensionOptions>({
  name: "comments",

  addOptions() {
    return {
      ydoc: null,
      onCommentClick: () => {},
      onAddComment: () => {},
    }
  },

  addProseMirrorPlugins() {
    const { ydoc, onCommentClick } = this.options

    return [
      new Plugin({
        key: new PluginKey("comments"),
        state: {
          init() {
            return DecorationSet.empty
          },
          apply(tr, decorationSet) {
            if (!ydoc) return decorationSet

            const yComments = ydoc.getMap("comments")
            const comments: Comment[] = []

            yComments.forEach((comment) => {
              comments.push(comment as Comment)
            })

            const decorations = comments
              .filter((comment) => !comment.resolved)
              .map((comment) => {
                return Decoration.inline(
                  comment.range.from,
                  comment.range.to,
                  {
                    class: `comment-highlight comment-${comment.id}`,
                    "data-comment-id": comment.id,
                    "data-comment-count": comment.replies.length + 1,
                    title: `${comment.author}: ${comment.content.substring(0, 50)}${comment.content.length > 50 ? "..." : ""}`,
                  },
                  {
                    inclusiveStart: false,
                    inclusiveEnd: false,
                  },
                )
              })

            return DecorationSet.create(tr.doc, decorations)
          },
        },
        props: {
          decorations(state) {
            return this.getState(state)
          },
          handleClick(view, pos, event) {
            const target = event.target as HTMLElement
            const commentId = target.getAttribute("data-comment-id")
            if (commentId) {
              onCommentClick(commentId)
              return true
            }
            return false
          },
        },
      }),
    ]
  },

  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          commentId: {
            default: null,
            parseHTML: (element) => element.getAttribute("data-comment-id"),
            renderHTML: (attributes) => {
              if (!attributes.commentId) {
                return {}
              }
              return {
                "data-comment-id": attributes.commentId,
                class: "comment-highlight",
              }
            },
          },
        },
      },
    ]
  },
})
