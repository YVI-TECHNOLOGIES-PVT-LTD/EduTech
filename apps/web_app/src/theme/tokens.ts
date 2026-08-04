export const themeTokens = {
    spacing: {
        compact: {
            padding: '12px',
            gap: '8px',
            cardPadding: '16px',
        },
        normal: {
            padding: '20px',
            gap: '16px',
            cardPadding: '24px',
        }
    },
    zIndex: {
        modal: 50,
        drawer: 45,
        popover: 40,
        dropdown: 35,
        header: 30,
        sidebar: 25,
    },
    radius: {
        none: '0px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        full: '9999px',
    },
    shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        focus: '0 0 0 2px hsl(var(--ring))',
    }
};
