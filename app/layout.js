export const metadata = {
  title: 'Radar de Curtidas',
  description: 'Análise de perfis com carinho',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap"
        />
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#FFF5F7' }}>
        {children}
      </body>
    </html>
  );
}