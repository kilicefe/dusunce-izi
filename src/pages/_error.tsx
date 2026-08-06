import { NextPageContext } from 'next';

export default function CustomError({ statusCode }: { statusCode?: number }) {
  return (
    <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif', color: '#333' }}>
      <h2>{statusCode ? `Hata ${statusCode}` : 'Bir Hata Oluştu'}</h2>
      <p>Sistemde beklenmeyen bir durum oluştu.</p>
    </div>
  );
}

CustomError.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};
