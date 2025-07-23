import { Box, Modal } from "@mui/material";
import { styleModalBox } from "./ZCommonComponents";

export default function AddTransaction(props: { open: boolean, onClose: () => void }){
    
    return (
        <Modal open={props.open} onClose={props.onClose}>
            <Box sx={styleModalBox}>
            </Box>
        </Modal>
    );
}
