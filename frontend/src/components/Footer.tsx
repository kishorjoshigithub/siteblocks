const Footer = () => {
  return (
    <div className="text-center py-4 text-gray-400 text-sm border-t bg-gray-800 mt-24">
      <p>
        Copyright © <span>{new Date().getFullYear()}</span> AI website builder -
        siteblocks
      </p>
    </div>
  );
};

export default Footer;
