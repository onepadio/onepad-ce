import clsx from 'clsx';

function WindowContainer(props) {
  const { children, className, ...other } = props;
  return (
            <div className={clsx('window-container', className)} {...other}>
      {children}
    </div>
  );
}

WindowContainer.propTypes = {
    // @ts-expect-error TS(2304): Cannot find name 'PropTypes'.
    children: PropTypes.node,
    // @ts-expect-error TS(2304): Cannot find name 'PropTypes'.
    className: PropTypes.string,
};

export default WindowContainer;