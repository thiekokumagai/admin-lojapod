import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import { Bold, Italic, List, ListOrdered, Heading2, Undo, Redo, Strikethrough } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  value?: string;
  onChange: (value: string) => void;
};

export function RichTextEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value ?? "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert focus:outline-none max-w-full min-h-[150px] px-4 py-3",
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="rounded-2xl border bg-background overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary focus-within:shadow-md transition-all">
      <style>{`
        .ProseMirror ul { list-style-type: disc !important; padding-left: 1.5rem !important; margin: 1rem 0 !important; }
        .ProseMirror ol { list-style-type: decimal !important; padding-left: 1.5rem !important; margin: 1rem 0 !important; }
        .ProseMirror li { margin-bottom: 0.25rem !important; }
      `}</style>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-1.5 bg-muted/20 border-b">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn("h-8 w-8 p-0", editor.isActive("bold") && "bg-accent text-accent-foreground")}
          title="Negrito"
        >
          <Bold className={cn("h-4 w-4", editor.isActive("bold") && "stroke-[2.5px]")} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn("h-8 w-8 p-0", editor.isActive("italic") && "bg-accent text-accent-foreground")}
          title="Itálico"
        >
          <Italic className={cn("h-4 w-4", editor.isActive("italic") && "stroke-[2.5px]")} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={cn("h-8 w-8 p-0", editor.isActive("strike") && "bg-accent text-accent-foreground")}
          title="Riscado"
        >
          <Strikethrough className={cn("h-4 w-4", editor.isActive("strike") && "stroke-[2.5px]")} />
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn("h-8 w-8 p-0", editor.isActive("heading", { level: 2 }) && "bg-accent text-accent-foreground")}
          title="Título"
        >
          <Heading2 className={cn("h-4 w-4", editor.isActive("heading", { level: 2 }) && "stroke-[2.5px]")} />
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn("h-8 w-8 p-0", editor.isActive("bulletList") && "bg-accent text-accent-foreground")}
          title="Lista com marcadores"
        >
          <List className={cn("h-4 w-4", editor.isActive("bulletList") && "stroke-[2.5px]")} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn("h-8 w-8 p-0", editor.isActive("orderedList") && "bg-accent text-accent-foreground")}
          title="Lista numerada"
        >
          <ListOrdered className={cn("h-4 w-4", editor.isActive("orderedList") && "stroke-[2.5px]")} />
        </Button>

        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Desfazer"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Refazer"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="max-h-[300px] min-h-[120px] overflow-y-auto"
      />
    </div>
  );
}