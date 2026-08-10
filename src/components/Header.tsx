type HeaderProps = {
  title: string;
  subtitle: string;
};

function Header({ title, subtitle } : HeaderProps) {
  return (
    <header>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      <hr/>
    </header>
  );
}

export default Header;