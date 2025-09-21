import type { Block } from 'payload'

export const Code: Block = {
  slug: 'code',
  interfaceName: 'CodeBlock',
  fields: [
    {
      name: 'language',
      type: 'select',
      defaultValue: 'typescript',
      options: [
        {
          label: 'TypeScript',
          value: 'typescript',
        },
        {
          label: 'JavaScript',
          value: 'javascript',
        },
        {
          label: 'CSS',
          value: 'css',
        },
        {
          label: 'HTML',
          value: 'html',
        },
        {
          label: 'Python',
          value: 'python',
        },
        {
          label: 'Bash/Shell',
          value: 'bash',
        },
        {
          label: 'JSON',
          value: 'json',
        },
        {
          label: 'YAML',
          value: 'yaml',
        },
        {
          label: 'Dockerfile',
          value: 'dockerfile',
        },
        {
          label: 'SQL',
          value: 'sql',
        },
        {
          label: 'Markdown',
          value: 'markdown',
        },
        {
          label: 'XML',
          value: 'xml',
        },
      ],
    },
    {
      name: 'code',
      type: 'code',
      label: false,
      required: true,
    },
  ],
}